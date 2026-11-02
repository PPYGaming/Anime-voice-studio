import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AudioLines, Upload, Play, Pause, SkipBack, SkipForward, Volume2, Scissors,
  Download, Settings2, Languages, Sparkles, FileAudio, Video, Music2, Users,
  Clock3, Search, Plus, Trash2, ChevronDown, PanelLeft, WandSparkles, ShieldCheck,
  CircleHelp, X, Check, AlertCircle, Subtitles, Mic2
} from 'lucide-react';
import './style.css';

const initialSegments = [
  {id:1, speaker:'Person 1', start:0.42, end:2.82, text:'Hey everyone, welcome back to the channel.', color:'#a78bfa'},
  {id:2, speaker:'Person 2', start:3.05, end:5.46, text:'Today we are going to try something new.', color:'#38bdf8'},
  {id:3, speaker:'Person 1', start:5.82, end:8.24, text:'Let’s get started with the video.', color:'#a78bfa'},
];
function fmt(s){s=Math.max(0,s||0);return `${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`}

function App(){
  const [file,setFile]=useState(null), [url,setUrl]=useState(''), [duration,setDuration]=useState(0);
  const [segments,setSegments]=useState(initialSegments), [selected,setSelected]=useState(1);
  const [current,setCurrent]=useState(0), [playing,setPlaying]=useState(false), [tab,setTab]=useState('Transcript');
  const [notice,setNotice]=useState(''); const [edited,setEdited]=useState(false);
  const videoRef=useRef(null), audioRef=useRef(null), inputRef=useRef(null);
  const active=segments.find(s=>s.id===selected)||segments[0];
  useEffect(()=>{if(!file)return; const u=URL.createObjectURL(file);setUrl(u);return()=>URL.revokeObjectURL(u)},[file]);
  useEffect(()=>{const v=videoRef.current;if(!v)return;const onTime=()=>setCurrent(v.currentTime||0);const onEnd=()=>setPlaying(false);v.addEventListener('timeupdate',onTime);v.addEventListener('ended',onEnd);return()=>{v.removeEventListener('timeupdate',onTime);v.removeEventListener('ended',onEnd)}},[url]);
  const togglePlay=()=>{const v=videoRef.current;if(!v)return;if(v.paused){v.play().then(()=>setPlaying(true)).catch(()=>{});}else{v.pause();setPlaying(false)}};
  const seek=(t)=>{setCurrent(t);if(videoRef.current)videoRef.current.currentTime=t};
  const updateText=(text)=>{setSegments(a=>a.map(s=>s.id===selected?{...s,text}:s));setEdited(true)};
  const addSegment=()=>{const id=Math.max(0,...segments.map(s=>s.id))+1;const s={id,speaker:'Person 1',start:current,end:Math.min(duration||current+2,current+2),text:'New transcript segment…',color:'#a78bfa'};setSegments(a=>[...a,s]);setSelected(id);setEdited(true)};
  const removeSegment=()=>{setSegments(a=>a.filter(s=>s.id!==selected));setSelected(segments.find(s=>s.id!==selected)?.id||0);setEdited(true)};
  const importFile=(f)=>{if(!f)return;if(!f.type.startsWith('video/')){setNotice('Please choose a video file (MP4, MOV, WebM).');return;}setFile(f);setCurrent(0);setPlaying(false);setNotice('Video loaded locally. No upload to a server.');};
  const exportNote=()=>{setNotice('This starter exports a transcript file. Full rendered MP4 export requires an audio/video processing module.');};
  const exportTranscript=()=>{const blob=new Blob([JSON.stringify({video:file?.name||null,segments},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='airi-transcript.json';a.click();URL.revokeObjectURL(a.href);};
  return <div className="app">
    <header className="topbar">
      <div className="brand"><div className="brandmark"><AudioLines size={20}/></div><div><b>AIRI</b><span>VOICE STUDIO</span></div></div>
      <div className="top-center"><span className="project-dot"/>{file?file.name:'Untitled project'}<ChevronDown size={14}/></div>
      <div className="top-actions"><span className="local-pill"><ShieldCheck size={13}/> LOCAL</span><button className="icon-btn" title="Settings"><Settings2 size={17}/></button><button className="export-btn" onClick={exportTranscript}><Download size={15}/> Export</button></div>
    </header>
    <main className="workspace">
      <aside className="sidebar">
        <div className="side-label">WORKSPACE</div>
        <button className="side-item active"><PanelLeft size={17}/> Editor</button>
        <button className="side-item" onClick={()=>setTab('Transcript')}><Subtitles size={17}/> Transcript</button>
        <button className="side-item" onClick={()=>setTab('Audio')}><AudioLines size={17}/> Audio tracks</button>
        <div className="side-label second">PROJECT</div>
        <div className="project-mini"><Video size={16}/><span>{file?file.name:'No video imported'}</span></div>
        <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={17}/><div><b>Getting started</b><small>Import a video to begin editing.</small></div></div><div className="version">AIRi Studio · Prototype 0.1</div></div>
      </aside>
      <section className="main-area">
        <div className="editor-head"><div><h1>Video editor</h1><p>Review your video and edit speaker transcripts.</p></div><div className="head-tools"><button className="outline-btn" onClick={()=>inputRef.current?.click()}><Upload size={15}/> Import video</button><input ref={inputRef} type="file" accept="video/*" hidden onChange={e=>importFile(e.target.files?.[0])}/><button className="outline-btn" onClick={()=>setNotice('AI transcription is not connected in this UI prototype yet.')}><Sparkles size={15}/> AI transcribe</button></div></div>
        <div className="preview-card">
          <div className="preview-toolbar"><span><Video size={14}/> PREVIEW</span><span className="preview-resolution">FIT <ChevronDown size={12}/></span></div>
          <div className="video-stage">
            {url?<video ref={videoRef} src={url} onLoadedMetadata={e=>setDuration(e.target.duration||0)} controls={false} />:
            <div className="empty-video"><div className="empty-icon"><Upload size={25}/></div><b>Drop a video to start</b><span>or import a file from your device</span><button onClick={()=>inputRef.current?.click()}>Choose video</button><small>Files stay on this device</small></div>}
          </div>
          <div className="player-controls"><button onClick={()=>seek(Math.max(0,current-5))}><SkipBack size={17}/></button><button className="play-btn" onClick={togglePlay}>{playing?<Pause size={17} fill="currentColor"/>:<Play size={17} fill="currentColor"/>}</button><button onClick={()=>seek(Math.min(duration,current+5))}><SkipForward size={17}/></button><span className="timecode">{fmt(current)} <em>/</em> {fmt(duration)}</span><div className="player-spacer"/><Volume2 size={16}/><div className="volume-line"><span/></div><button onClick={()=>videoRef.current?.requestFullscreen?.()} title="Fullscreen"><PanelLeft size={16}/></button></div>
        </div>
        <div className="timeline-card">
          <div className="timeline-header"><div className="tabs"><button className={tab==='Transcript'?'selected':''} onClick={()=>setTab('Transcript')}><Subtitles size={14}/> Transcript</button><button className={tab==='Audio'?'selected':''} onClick={()=>setTab('Audio')}><AudioLines size={14}/> Audio tracks</button></div><div className="timeline-actions"><button title="Add segment" onClick={addSegment}><Plus size={15}/></button><button title="Trim (demo)" onClick={()=>setNotice('Trim tools are planned; this prototype keeps original media unchanged.')}><Scissors size={15}/></button></div></div>
          <div className="ruler"><span>00:00</span><span>00:05</span><span>00:10</span><span>00:15</span><span>00:20</span><span>00:25</span></div>
          <div className="track-row"><div className="track-name"><Video size={14}/> Video</div><div className="track-lane"><div className="video-clip" style={{width:duration?`${Math.min(100,duration/25*100)}%`:'68%'}}>{file?.name||'Import a video'}</div></div></div>
          <div className="track-row"><div className="track-name"><Music2 size={14}/> Original</div><div className="track-lane"><div className="audio-clip original"><Wave/></div></div></div>
          {segments.slice(0,4).map(s=><div className="track-row" key={s.id}><div className="track-name"><Mic2 size={14} style={{color:s.color}}/>{s.speaker}</div><div className="track-lane"><button className={`voice-clip ${selected===s.id?'chosen':''}`} style={{left:`${duration?Math.min(90,s.start/duration*100):s.start*4}%`,width:`${duration?Math.max(8,(s.end-s.start)/duration*100):15}%`,borderColor:s.color,background:`${s.color}22`}} onClick={()=>{setSelected(s.id);seek(s.start)}}><Wave color={s.color}/></button></div></div>)}
          <div className="playhead" style={{left:`calc(160px + ${duration?current/duration*100:current*4}% )`}}><div/></div>
          <div className="timeline-footer"><span><Clock3 size={13}/> {duration?fmt(duration):'00:00'} total</span><span>Timeline · local preview</span></div>
        </div>
      </section>
      <aside className="inspector">
        <div className="inspector-title"><h2>Inspector</h2><button className="icon-btn"><Settings2 size={16}/></button></div>
        <div className="inspector-tabs"><button className="active">Segment</button><button onClick={()=>setTab('Audio')}>Audio</button></div>
        {active?<><div className="section-label">SPEAKER</div><div className="speaker-box"><div className="avatar" style={{background:`${active.color}25`,color:active.color}}><Users size={17}/></div><div><b>{active.speaker}</b><small>Detected speaker · Track {active.id}</small></div><button className="mini-chevron"><ChevronDown size={14}/></button></div>
          <div className="section-label">TRANSCRIPT TEXT</div><div className="text-editor"><textarea value={active.text} onChange={e=>updateText(e.target.value)} placeholder="Edit spoken words here…"/><div className="text-meta"><span><Languages size={12}/> Original language</span><span>{active.text.length} chars</span></div></div>
          <div className="section-label">SEGMENT TIMING</div><div className="timing-grid"><label>Start <input value={active.start.toFixed(2)} readOnly/></label><label>End <input value={active.end.toFixed(2)} readOnly/></label></div>
          <button className="wide-secondary" onClick={()=>seek(active.start)}><Play size={14}/> Play this segment</button>
          <div className="section-label">VOICE</div><div className="voice-setting"><div className="voice-icon"><Mic2 size={16}/></div><div><b>Original speaker voice</b><small>Voice cloning not connected</small></div><span className="lock">LOCAL</span></div>
          <button className="wide-primary" onClick={()=>setNotice('Voice regeneration requires an on-device compatible voice model. No audio was changed.') }><WandSparkles size={15}/> Regenerate voice <span>↗</span></button>
          <button className="delete-btn" onClick={removeSegment}><Trash2 size={14}/> Remove segment</button>
        </>:<div className="empty-inspector">Select or add a transcript segment.</div>}
        <div className="inspector-bottom"><ShieldCheck size={14}/> <span>Media remains on your device</span></div>
      </aside>
    </main>
    <footer className="statusbar"><span><span className="status-dot"/> Ready</span><span>Browser-based · No account</span><span>RAM requirement: 4GB+ (recommended 8GB)</span></footer>
    {notice&&<div className="toast"><AlertCircle size={16}/>{notice}<button onClick={()=>setNotice('')}><X size={15}/></button></div>}
  </div>
}
function Wave({color='currentColor'}){return <div className="wave" aria-hidden="true">{Array.from({length:45},(_,i)=><i key={i} style={{height:`${8+Math.abs(Math.sin(i*1.7)*Math.cos(i*.3))*78}%`,background:color}}/>)}</div>}
createRoot(document.getElementById('root')).render(<App/>);
