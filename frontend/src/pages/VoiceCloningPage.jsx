import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdAudiotrack,
  MdAutoAwesome,
  MdBookmarkAdded,
  MdCheckCircle,
  MdCloudUpload,
  MdClose,
  MdDelete,
  MdDownload,
  MdGraphicEq,
  MdMic,
  MdOutlineSecurity,
  MdRefresh,
  MdReplay,
  MdStop,
  MdTune
} from 'react-icons/md'
import Sidebar from '../components/Sidebar.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorAlert from '../components/ErrorAlert.jsx'
import WorkspaceThemeToggle from '../components/WorkspaceThemeToggle.jsx'
import { useAuth, useToast, useVoiceJob } from '../App.jsx'
import api from '../services/api.js'
import { deleteDefaultVoiceSample, getDefaultVoiceSample, saveDefaultVoiceSample } from '../services/voiceProfileStorage.js'
import { useLocation, useNavigate } from 'react-router-dom'

const REFERENCE_TEXT = 'The quick brown fox jumps over the lazy dog. Please speak clearly, with a calm and natural voice. Bright stars shine above the quiet valley, while gentle waves move across the shore.'
const MAX_AUDIO_SIZE = 15 * 1024 * 1024
const MAX_SCRIPT_LENGTH = 5000
const ACCEPTED_AUDIO_TYPES = [
  'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mpeg', 'audio/mp3',
  'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/ogg', 'application/ogg',
  'audio/webm', 'video/webm'
]

const PRESETS = [
  { id: 'social', label: 'Social Post', prompt: 'Create a short spoken social update that shares an exciting new project and invites the audience to follow along.' },
  { id: 'product', label: 'Product Promo', prompt: 'Introducing a smarter way to create content. Turn your ideas into polished, platform-ready copy in seconds.' },
  { id: 'narration', label: 'Narration', prompt: 'Every great idea begins as a quiet thought. With the right tools and a clear voice, it can become a story worth sharing.' },
  { id: 'announcement', label: 'Announcement', prompt: 'We are excited to share an important update with our community. A new experience is arriving soon.' },
  { id: 'custom', label: 'Custom', prompt: '' }
]

const DELIVERY_TONES = ['Calm', 'Friendly', 'Energetic', 'Serious']

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return String(minutes).padStart(2, '0') + ':' + String(remaining).padStart(2, '0')
}

const chooseRecorderMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return ''
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
    .find((type) => MediaRecorder.isTypeSupported?.(type)) || ''
}

const getApiMessage = async (error) => {
  const data = error?.response?.data
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text())
      if (body?.message) return body.message
    } catch {
      return 'Voice generation failed. Please try again.'
    }
  }
  if (data?.message) return data.message
  if (!error?.response) return 'Cannot reach the SmartGen server. Make sure the backend is running and try again.'
  return 'Voice generation failed. Please try again.'
}

export default function VoiceCloningPage() {
  const toast = useToast()
  const { user } = useAuth()
  const voiceOwnerId = user?._id || user?.id || user?.email || 'local'
  const location = useLocation()
  const navigate = useNavigate()
  const {
    job,
    trackJob,
    clearJob,
    cancelJob,
    downloadJobAudio
  } = useVoiceJob()

  const [sampleMode, setSampleMode] = useState('record')
  const [sampleFile, setSampleFile] = useState(null)
  const [sampleUrl, setSampleUrl] = useState('')
  const [referenceText, setReferenceText] = useState(REFERENCE_TEXT)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [consent, setConsent] = useState(false)
  const [rememberVoice, setRememberVoice] = useState(false)
  const [savedVoiceMeta, setSavedVoiceMeta] = useState(null)

  const [scriptMode, setScriptMode] = useState('topic')
  const [topic, setTopic] = useState('')
  const [preset, setPreset] = useState('custom')
  const [deliveryTone, setDeliveryTone] = useState('Friendly')
  const [script, setScript] = useState('')
  const [addFillers, setAddFillers] = useState(true)
  const [scriptLoading, setScriptLoading] = useState(false)

  const [speed, setSpeed] = useState(1)
  const [quality, setQuality] = useState('high')
  const [variation, setVariation] = useState('natural')
  const [removeSilence, setRemoveSilence] = useState(true)

  const [creatingJob, setCreatingJob] = useState(false)
  const [resultUrl, setResultUrl] = useState('')
  const [error, setError] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const sampleUrlRef = useRef('')
  const resultUrlRef = useRef('')
  const loadedJobRef = useRef('')

  const jobRunning = ['queued', 'processing'].includes(job?.status)
  const generating = creatingJob || jobRunning
  const recorderSupported = typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined'

  const revokeUrl = (urlRef) => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = ''
    }
  }

  const stopMediaStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
  }

  const clearRecordingTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => () => {
    clearRecordingTimer()
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    stopMediaStream()
    revokeUrl(sampleUrlRef)
    revokeUrl(resultUrlRef)
  }, [])

  useEffect(() => {
    if (!jobRunning || !job?.createdAt) {
      setElapsedSeconds(0)
      return undefined
    }

    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - Date.parse(job.createdAt)) / 1000)))
    }
    updateElapsed()
    const intervalId = setInterval(updateElapsed, 1000)
    return () => clearInterval(intervalId)
  }, [jobRunning, job?.createdAt])

  useEffect(() => {
    if (job?.script && !script) setScript(job.script)
    if (job?.status === 'failed') setError(job.error?.message || 'Voice generation failed.')
  }, [job?.id, job?.status, job?.script, job?.error?.message, script])

  useEffect(() => {
    if (job?.status !== 'completed' || !job.hasAudio || loadedJobRef.current === job.id) return

    let active = true
    loadedJobRef.current = job.id
    downloadJobAudio()
      .then((response) => {
        if (!active) return
        revokeUrl(resultUrlRef)
        const blob = response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: response.headers['content-type'] || 'audio/mpeg' })
        const nextUrl = URL.createObjectURL(blob)
        resultUrlRef.current = nextUrl
        setResultUrl(nextUrl)
        setError('')
      })
      .catch(async (requestError) => {
        if (!active) return
        loadedJobRef.current = ''
        setError(await getApiMessage(requestError))
      })

    return () => { active = false }
  }, [job?.id, job?.status, job?.hasAudio, downloadJobAudio])

  const setVoiceSample = (file, { fromSaved = false } = {}) => {
    revokeUrl(sampleUrlRef)
    const nextUrl = URL.createObjectURL(file)
    sampleUrlRef.current = nextUrl
    setSampleFile(file)
    setSampleUrl(nextUrl)
    setError('')
    if (!fromSaved) setRememberVoice(false)
  }

  useEffect(() => {
    let active = true

    const loadVoiceDefaults = async () => {
      const [preferencesResult, savedVoiceResult] = await Promise.allSettled([
        api.get('/preferences'),
        getDefaultVoiceSample(voiceOwnerId)
      ])
      if (!active) return

      if (preferencesResult.status === 'fulfilled') {
        const preferences = preferencesResult.value.data?.preferences || {}
        if (preferences.preferredVoiceTone) setDeliveryTone(preferences.preferredVoiceTone)
        if (Number.isFinite(Number(preferences.preferredVoiceSpeed))) setSpeed(Number(preferences.preferredVoiceSpeed))
        if (preferences.preferredVoiceQuality) setQuality(preferences.preferredVoiceQuality)
        if (preferences.preferredVoiceVariation) setVariation(preferences.preferredVoiceVariation)
        if (typeof preferences.preferredVoiceRemoveSilence === 'boolean') setRemoveSilence(preferences.preferredVoiceRemoveSilence)
        if (typeof preferences.preferredVoiceNaturalize === 'boolean') setAddFillers(preferences.preferredVoiceNaturalize)
      }

      if (savedVoiceResult.status === 'fulfilled' && savedVoiceResult.value) {
        const saved = savedVoiceResult.value
        setVoiceSample(saved.file, { fromSaved: true })
        setSampleMode('upload')
        setReferenceText(saved.referenceText || REFERENCE_TEXT)
        setConsent(true)
        setRememberVoice(true)
        setSavedVoiceMeta(saved)
      }
    }

    loadVoiceDefaults()
    return () => { active = false }
  }, [])

  // Pre-fill topic when navigating from Playground
  useEffect(() => {
    const initial = location.state?.initialTopic
    if (initial) {
      setTopic(initial)
      setScriptMode('topic')
      navigate('/voice-cloning', { replace: true, state: null })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRememberVoice = async (event) => {
    const shouldRemember = event.target.checked

    if (!shouldRemember) {
      try {
        await deleteDefaultVoiceSample(voiceOwnerId)
        setRememberVoice(false)
        setSavedVoiceMeta(null)
        toast('Saved voice removed from this device.', 'info')
      } catch {
        toast('Could not remove the saved voice from this device.', 'error')
      }
      return
    }

    if (!sampleFile) {
      toast('Record or upload a voice sample first.', 'error')
      return
    }
    if (!consent) {
      toast('Confirm voice permission before saving it.', 'error')
      return
    }
    if (!referenceText.trim()) {
      toast('Enter the exact transcript before saving this voice.', 'error')
      return
    }

    try {
      const saved = await saveDefaultVoiceSample(sampleFile, referenceText, voiceOwnerId)
      setRememberVoice(true)
      setSavedVoiceMeta(saved)
      toast('Default voice saved on this device.', 'success')
    } catch {
      toast('This browser could not save the voice locally.', 'error')
    }
  }

  const validateAudio = (file) => {
    const extension = '.' + (file.name.split('.').pop() || '').toLowerCase()
    const normalizedType = (file.type || '').toLowerCase().split(';')[0]
    if (!ACCEPTED_AUDIO_TYPES.includes(normalizedType) || !['.wav', '.mp3', '.m4a', '.ogg', '.webm'].includes(extension)) {
      toast('Upload a WAV, MP3, M4A, OGG, or WebM audio file.', 'error')
      return false
    }
    if (file.size > MAX_AUDIO_SIZE) {
      toast('Voice samples must be 15 MB or smaller.', 'error')
      return false
    }
    return true
  }

  const handleFile = (file) => {
    if (!file || !validateAudio(file)) return
    setVoiceSample(file)
    toast('Voice sample ready. Confirm its exact transcript below.', 'success')
  }

  const removeSample = () => {
    revokeUrl(sampleUrlRef)
    setSampleFile(null)
    setSampleUrl('')
    setRecordingSeconds(0)
    setRememberVoice(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const changeSampleMode = (mode) => {
    setSampleMode(mode)
    if (mode === 'record') setReferenceText(REFERENCE_TEXT)
  }

  const startRecording = async () => {
    if (!recorderSupported || isRecording) {
      if (!recorderSupported) toast('Recording is not supported in this browser. Upload an audio file instead.', 'error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })
      const mimeType = chooseRecorderMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      mediaStreamRef.current = stream
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      setRecordingSeconds(0)
      setError('')

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data)
      }

      recorder.onerror = () => {
        clearRecordingTimer()
        stopMediaStream()
        setIsRecording(false)
        toast('Recording failed. Check microphone access or upload a file.', 'error')
      }

      recorder.onstop = () => {
        clearRecordingTimer()
        stopMediaStream()
        setIsRecording(false)
        if (!chunksRef.current.length) return

        const recordingType = recorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: recordingType })
        const extension = recordingType.includes('ogg') ? 'ogg' : recordingType.includes('mp4') ? 'm4a' : 'webm'
        const file = new File([blob], 'smartgen-voice-sample.' + extension, { type: recordingType })
        if (validateAudio(file)) {
          setVoiceSample(file)
          setReferenceText(REFERENCE_TEXT)
          toast('Recording captured successfully.', 'success')
        }
      }

      recorder.start(250)
      setIsRecording(true)
      timerRef.current = setInterval(() => {
        setRecordingSeconds((value) => {
          const next = value + 1
          if (next >= 30 && mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
          return next
        })
      }, 1000)
    } catch {
      clearRecordingTimer()
      stopMediaStream()
      setIsRecording(false)
      toast('Microphone access was not available. Allow permission or upload audio.', 'error')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  const selectPreset = (item) => {
    setPreset(item.id)
    if (item.id !== 'custom') {
      if (scriptMode === 'topic') setTopic(item.prompt)
      else setScript(item.prompt)
    }
  }

  const buildAiScript = async () => {
    const source = scriptMode === 'topic' ? topic.trim() : script.trim()
    if (!source) {
      toast(scriptMode === 'topic' ? 'Enter a topic first.' : 'Enter an idea or choose a preset first.', 'error')
      return ''
    }

    setScriptLoading(true)
    try {
      const fillersInstruction = addFillers
        ? 'Add at most one or two subtle conversational fillers such as "well" or "um" only where genuinely natural.'
        : 'Do not add filler words.'
      const response = await api.post('/content/generate-text', {
        prompt: 'Write a concise spoken voice-over script about: ' + source
          + '. Delivery tone: ' + deliveryTone
          + '. Add natural punctuation, short sentences, and contextual pauses using commas or ellipses. '
          + fillersInstruction
          + ' Return only the final spoken script. Do not use stage directions, SSML, brackets, or labels.',
        tone: deliveryTone,
        platform: 'Voice',
        contentType: 'spoken script',
        keywords: ''
      })
      const generated = String(response.data?.result || '').trim().slice(0, MAX_SCRIPT_LENGTH)
      if (!generated) throw new Error('Empty script')
      setScript(generated)
      toast('Natural voice script generated.', 'success')
      return generated
    } catch {
      toast('Could not generate a script right now. You can still write one manually.', 'error')
      return ''
    } finally {
      setScriptLoading(false)
    }
  }

  const generateVoice = async () => {
    if (generating) return
    if (!sampleFile) {
      toast('Record or upload a voice sample first.', 'error')
      return
    }
    if (!referenceText.trim()) {
      toast('Enter the exact words spoken in your sample.', 'error')
      return
    }
    if (!consent) {
      toast('Confirm that you have permission to use this voice.', 'error')
      return
    }

    let finalScript = script.trim()
    if (scriptMode === 'topic') finalScript = await buildAiScript()
    if (!finalScript) {
      if (scriptMode !== 'topic') toast('Enter or generate the script first.', 'error')
      return
    }

    if (rememberVoice) {
      try {
        const saved = await saveDefaultVoiceSample(sampleFile, referenceText, voiceOwnerId)
        setSavedVoiceMeta(saved)
      } catch {
        toast('Voice generation will continue, but the default voice could not be updated.', 'info')
      }
    }

    setCreatingJob(true)
    setError('')
    revokeUrl(resultUrlRef)
    setResultUrl('')
    loadedJobRef.current = ''

    try {
      const formData = new FormData()
      formData.append('voice_sample', sampleFile)
      formData.append('reference_text', referenceText.trim())
      formData.append('script', finalScript)
      formData.append('speed', String(speed))
      formData.append('quality', quality)
      formData.append('variation', variation)
      formData.append('remove_silence', String(removeSilence))
      formData.append('tone', deliveryTone)

      const response = await api.post('/voice/jobs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90_000
      })

      trackJob(response.data?.job)
      toast('Voice generation started. You can use other SmartGen tools while it runs.', 'success')
    } catch (requestError) {
      const message = await getApiMessage(requestError)
      setError(message)
      toast(message, 'error')
    } finally {
      setCreatingJob(false)
    }
  }

  const handleCancel = async () => {
    try {
      await cancelJob()
      toast('Voice generation canceled.', 'info')
    } catch (requestError) {
      toast(await getApiMessage(requestError), 'error')
    }
  }

  const resetResult = () => {
    revokeUrl(resultUrlRef)
    setResultUrl('')
    setError('')
    loadedJobRef.current = ''
    clearJob()
  }

  const downloadAudio = () => {
    if (!resultUrl) return
    const link = document.createElement('a')
    link.href = resultUrl
    link.download = 'smartgen-cloned-voice.mp3'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content voice-cloning-page">
        <header className="voice-page-header">
          <div>
            <div className="voice-title-row">
              <h1>Voice Cloning <MdGraphicEq aria-hidden="true" /></h1>
              <span className="voice-beta-badge">Beta</span>
            </div>
            <p>Add a voice sample, enter a topic, and create audio.</p>
          </div>
          <div className="voice-header-tools"><WorkspaceThemeToggle /></div>
        </header>

        <div className="voice-workspace-grid">
          <div className="voice-input-column">
            <motion.section className="card voice-step-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="voice-step-heading">
                <span>1</span>
                <div><h2>Add your voice</h2><p>Record 8-12 seconds or upload audio.</p></div>
              </div>

              <div className="voice-mode-tabs" role="tablist" aria-label="Voice sample source">
                <button type="button" role="tab" aria-selected={sampleMode === 'record'} className={sampleMode === 'record' ? 'active' : ''} onClick={() => changeSampleMode('record')} disabled={isRecording}><MdMic /> Record Voice</button>
                <button type="button" role="tab" aria-selected={sampleMode === 'upload'} className={sampleMode === 'upload' ? 'active' : ''} onClick={() => changeSampleMode('upload')} disabled={isRecording}><MdCloudUpload /> Upload Audio</button>
              </div>

              {!sampleFile && sampleMode === 'record' && (
                <div className={'voice-recorder ' + (isRecording ? 'recording' : '')}>
                  <div className="voice-recorder-visual" aria-hidden="true"><span /><span /><span /><span /><span /></div>
                  <strong>{isRecording ? 'Recording your sample' : 'Ready to record'}</strong>
                  <div className="voice-recording-time" aria-live="polite">{formatTime(recordingSeconds)}</div>
                  <button type="button" className={'btn ' + (isRecording ? 'voice-stop-button' : 'btn-primary')} onClick={isRecording ? stopRecording : startRecording}>
                    {isRecording ? <><MdStop /> Stop Recording</> : <><MdMic /> Start Recording</>}
                  </button>
                </div>
              )}

              {!sampleFile && sampleMode === 'upload' && (
                <button type="button" className="voice-upload-area" onClick={() => fileInputRef.current?.click()}>
                  <MdCloudUpload size={42} /><strong>Choose audio</strong><span>WAV, MP3, M4A, OGG or WebM</span>
                </button>
              )}

              <input ref={fileInputRef} type="file" accept=".wav,.mp3,.m4a,.ogg,.webm,audio/*" onChange={(event) => handleFile(event.target.files?.[0])} hidden />

              {sampleFile && (
                <div className="voice-sample-preview">
                  <div className="voice-audio-icon"><MdAudiotrack /></div>
                  <div className="voice-audio-details">
                    <strong>{sampleFile.name}</strong><span>{(sampleFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    {rememberVoice && <span className="voice-default-badge" title={savedVoiceMeta?.updatedAt ? `Saved ${new Date(savedVoiceMeta.updatedAt).toLocaleDateString()}` : undefined}><MdBookmarkAdded /> Default voice</span>}
                    <audio controls src={sampleUrl}>Audio playback is unavailable.</audio>
                  </div>
                  <div className="voice-sample-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { removeSample(); changeSampleMode('record') }} title="Record again"><MdReplay /></button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()} title="Replace audio"><MdRefresh /></button>
                    <button type="button" className="btn btn-ghost btn-sm voice-delete-button" onClick={removeSample} title="Remove sample"><MdDelete /></button>
                  </div>
                </div>
              )}

              <div className="voice-reference-block">
                <div>
                  <strong>{sampleMode === 'record' ? 'Read this exact reference script' : 'Exact transcript of uploaded audio'}</strong>
                  
                </div>
                {sampleMode === 'record' ? (
                  <blockquote>{REFERENCE_TEXT}</blockquote>
                ) : (
                  <textarea className="voice-reference-input" value={referenceText} onChange={(event) => setReferenceText(event.target.value)} maxLength={1000} rows={4} placeholder="Type exactly what is spoken in the uploaded sample..." />
                )}
                <p className="voice-alignment-warning">Use the exact spoken words to avoid extra words.</p>
              </div>


              <label className="voice-consent">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                <span><MdOutlineSecurity /> I have permission to use this voice.</span>
              </label>

              {sampleFile && (
                <label className="voice-remember-option">
                  <input type="checkbox" checked={rememberVoice} onChange={handleRememberVoice} />
                  <span>
                    <strong>Use as my default voice</strong>
                    <small>Saved only in this browser. You can remove it from Preferences.</small>
                  </span>
                </label>
              )}
            </motion.section>

            <motion.section className="card voice-step-card voice-simple-script-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <div className="voice-step-heading">
                <span>2</span>
                <div><h2>What should it say?</h2><p>Use a topic or paste your own script.</p></div>
              </div>

              <div className="voice-mode-tabs voice-script-mode" role="tablist" aria-label="Content mode">
                <button type="button" className={scriptMode === 'topic' ? 'active' : ''} onClick={() => setScriptMode('topic')}><MdAutoAwesome /> Topic</button>
                <button type="button" className={scriptMode === 'write' ? 'active' : ''} onClick={() => setScriptMode('write')}>My Script</button>
              </div>

              <div className="voice-simple-options">
                <label>
                  <span>Style</span>
                  <select value={preset} onChange={(event) => {
                    const item = PRESETS.find((option) => option.id === event.target.value) || PRESETS[4]
                    selectPreset(item)
                  }}>
                    {PRESETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>

                <label>
                  <span>Tone</span>
                  <select value={deliveryTone} onChange={(event) => setDeliveryTone(event.target.value)}>
                    {DELIVERY_TONES.map((tone) => <option key={tone}>{tone}</option>)}
                  </select>
                </label>
              </div>

              {scriptMode === 'topic' ? (
                <div className="form-group voice-main-input">
                  <label className="form-label" htmlFor="voice-topic">Topic</label>
                  <textarea id="voice-topic" value={topic} onChange={(event) => setTopic(event.target.value)} rows={4} placeholder="e.g. Announce our university technology exhibition..." />
                </div>
              ) : (
                <div className="form-group voice-main-input">
                  <div className="voice-script-toolbar">
                    <label htmlFor="voice-script">Script</label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={buildAiScript} disabled={scriptLoading || jobRunning}>
                      <MdAutoAwesome /> {scriptLoading ? 'Improving...' : 'Improve with AI'}
                    </button>
                  </div>
                  <textarea id="voice-script" value={script} maxLength={MAX_SCRIPT_LENGTH} onChange={(event) => setScript(event.target.value)} rows={6} placeholder="Paste what the voice should say..." />
                  <div className="voice-character-count">{script.length.toLocaleString()} / {MAX_SCRIPT_LENGTH.toLocaleString()}</div>
                </div>
              )}

              <label className="voice-naturalize-option voice-naturalize-compact">
                <input type="checkbox" checked={addFillers} onChange={(event) => setAddFillers(event.target.checked)} />
                <span><strong>Make it conversational</strong></span>
              </label>

              <details className="voice-advanced-settings">
                <summary><MdTune /> Advanced settings</summary>
                <div className="voice-control-grid">
                  <label>
                    <span>Speed <strong>{speed.toFixed(2)}x</strong></span>
                    <input type="range" min="0.8" max="1.2" step="0.05" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
                  </label>
                  <label>
                    <span>Quality</span>
                    <select value={quality} onChange={(event) => setQuality(event.target.value)}>
                      <option value="standard">Standard</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  <label>
                    <span>Variation</span>
                    <select value={variation} onChange={(event) => setVariation(event.target.value)}>
                      <option value="stable">Stable</option>
                      <option value="natural">Natural</option>
                    </select>
                  </label>
                  <label className="voice-switch-row">
                    <span>Trim silence</span>
                    <input type="checkbox" checked={removeSilence} onChange={(event) => setRemoveSilence(event.target.checked)} />
                  </label>
                </div>
              </details>
            </motion.section>
          </div>

          <motion.section className="card voice-result-card" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
            <div className="voice-step-heading">
              <span>3</span>
              <div><h2>Your audio</h2></div>
            </div>

            <AnimatePresence mode="wait">
              {generating && (
                <motion.div key="loading" className="voice-result-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LoadingState label={creatingJob ? 'Preparing your voice job...' : (job?.stage || 'Creating your voice result...')} />
                  <div className="voice-job-progress" aria-label="Voice generation progress"><span style={{ width: (job?.progress || 15) + '%' }} /></div>
                  <p>{formatTime(elapsedSeconds)} - You can leave this page.</p>
                  {jobRunning && <button type="button" className="btn btn-secondary voice-cancel-job" onClick={handleCancel}><MdClose /> Cancel Generation</button>}
                </motion.div>
              )}

              {!generating && error && (
                <motion.div key="error" className="voice-result-state voice-result-error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <ErrorAlert message={error} />
                  <button type="button" className="btn btn-secondary" onClick={resetResult}><MdRefresh /> Start Again</button>
                </motion.div>
              )}

              {!generating && !error && !resultUrl && (
                <motion.div key="empty" className="voice-result-state voice-result-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="voice-result-icon"><MdGraphicEq /></div>
                  <h3>Your audio will appear here</h3>
                  <p>Add your voice and enter a topic.</p>
                </motion.div>
              )}

              {!generating && resultUrl && (
                <motion.div key="result" className="voice-result-state voice-result-success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="voice-success-mark"><MdCheckCircle /></div>
                  <span className="voice-ready-label">Voice ready</span>
                  <h3>Your audio has been generated</h3>
                  <audio controls src={resultUrl}>Audio playback is unavailable.</audio>
                  <div className="voice-result-actions">
                    <button type="button" className="btn btn-secondary" onClick={resetResult}><MdRefresh /> New Voice</button>
                    <button type="button" className="btn btn-primary" onClick={downloadAudio}><MdDownload /> Download MP3</button>
                  </div>
                  <div className="voice-privacy-note"><MdOutlineSecurity /> Temporary result - not saved to history.</div>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="button" className="btn btn-primary voice-generate-button" onClick={generateVoice} disabled={generating || scriptLoading || !sampleFile || !consent || !(script.trim() || (scriptMode === 'topic' && topic.trim()))}>
              {generating
                ? <><span className="spinner" /> Voice Job Running...</>
                : <><MdAutoAwesome /> Create Voice</>}
            </button>
          </motion.section>
        </div>
      </main>
    </div>
  )
}








