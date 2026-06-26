const fs = require('fs');
const vm = require('vm');

const MP3_BITRATE_KBPS = 128;
let lameBundle;

const getLame = () => {
  if (!lameBundle) {
    const context = {};
    vm.createContext(context);
    const bundlePath = require.resolve('lamejs/lame.min.js');
    vm.runInContext(fs.readFileSync(bundlePath, 'utf8'), context);
    lameBundle = context.lamejs;
  }

  if (!lameBundle?.Mp3Encoder) throw new Error('MP3 encoder is unavailable.');
  return lameBundle;
};

const isMp3 = (contentType = '', buffer) => {
  const normalizedType = String(contentType).toLowerCase();
  return normalizedType.includes('mpeg') || normalizedType.includes('mp3')
    || buffer?.subarray?.(0, 3).toString('ascii') === 'ID3';
};

const readAscii = (buffer, start, end) => buffer.subarray(start, end).toString('ascii');

const findWavChunks = (buffer) => {
  if (buffer.length < 44 || readAscii(buffer, 0, 4) !== 'RIFF' || readAscii(buffer, 8, 12) !== 'WAVE') {
    throw new Error('Unsupported audio container.');
  }

  let offset = 12;
  let format = null;
  let data = null;

  while (offset + 8 <= buffer.length) {
    const id = readAscii(buffer, offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + size;

    if (end > buffer.length) break;

    if (id === 'fmt ') {
      format = {
        audioFormat: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        bitsPerSample: buffer.readUInt16LE(start + 14)
      };
    }

    if (id === 'data') {
      data = buffer.subarray(start, end);
    }

    offset = end + (size % 2);
  }

  if (!format || !data?.length) {
    throw new Error('Invalid WAV audio.');
  }

  return { format, data };
};

const readSampleAsInt16 = (data, byteOffset, bitsPerSample, audioFormat) => {
  if (audioFormat === 3 && bitsPerSample === 32) {
    const sample = Math.max(-1, Math.min(1, data.readFloatLE(byteOffset)));
    return Math.round(sample * 32767);
  }

  if (bitsPerSample === 16) return data.readInt16LE(byteOffset);

  if (bitsPerSample === 24) {
    let value = data[byteOffset] | (data[byteOffset + 1] << 8) | (data[byteOffset + 2] << 16);
    if (value & 0x800000) value |= 0xff000000;
    return Math.max(-32768, Math.min(32767, value >> 8));
  }

  if (bitsPerSample === 32) {
    return Math.max(-32768, Math.min(32767, data.readInt32LE(byteOffset) >> 16));
  }

  throw new Error('Unsupported WAV bit depth.');
};

const wavToChannels = (buffer) => {
  const { format, data } = findWavChunks(buffer);
  const { audioFormat, channels, sampleRate, bitsPerSample } = format;

  if (![1, 3].includes(audioFormat)) throw new Error('Unsupported WAV format.');
  if (![1, 2].includes(channels)) throw new Error('Unsupported WAV channel count.');
  if (![16, 24, 32].includes(bitsPerSample)) throw new Error('Unsupported WAV bit depth.');

  const bytesPerSample = bitsPerSample / 8;
  const frameSize = bytesPerSample * channels;
  const frameCount = Math.floor(data.length / frameSize);
  const left = new Int16Array(frameCount);
  const right = channels === 2 ? new Int16Array(frameCount) : null;

  for (let frame = 0; frame < frameCount; frame += 1) {
    const frameOffset = frame * frameSize;
    left[frame] = readSampleAsInt16(data, frameOffset, bitsPerSample, audioFormat);
    if (right) {
      right[frame] = readSampleAsInt16(data, frameOffset + bytesPerSample, bitsPerSample, audioFormat);
    }
  }

  return { sampleRate, channels, left, right };
};

const encodeMp3FromPcm = ({ sampleRate, channels, left, right }) => {
  const encoder = new (getLame().Mp3Encoder)(channels, sampleRate, MP3_BITRATE_KBPS);
  const chunks = [];
  const blockSize = 1152;

  for (let index = 0; index < left.length; index += blockSize) {
    const leftChunk = left.subarray(index, index + blockSize);
    const rightChunk = right?.subarray(index, index + blockSize);
    const encoded = channels === 2
      ? encoder.encodeBuffer(leftChunk, rightChunk)
      : encoder.encodeBuffer(leftChunk);
    if (encoded.length) chunks.push(Buffer.from(encoded));
  }

  const flushed = encoder.flush();
  if (flushed.length) chunks.push(Buffer.from(flushed));

  return Buffer.concat(chunks);
};

const ensureMp3Audio = (audio) => {
  if (isMp3(audio.contentType, audio.buffer)) {
    return {
      ...audio,
      contentType: 'audio/mpeg',
      filename: 'smartgen-cloned-voice.mp3'
    };
  }

  const pcm = wavToChannels(audio.buffer);
  const mp3Buffer = encodeMp3FromPcm(pcm);

  if (!mp3Buffer.length) throw new Error('MP3 encoding failed.');

  return {
    ...audio,
    buffer: mp3Buffer,
    contentType: 'audio/mpeg',
    filename: 'smartgen-cloned-voice.mp3'
  };
};

module.exports = {
  ensureMp3Audio,
  wavToChannels,
  isMp3
};

