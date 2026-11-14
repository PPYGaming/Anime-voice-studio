import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AudioLines, Upload, Play, Pause, SkipBack, SkipForward, Volume2, Scissors,
  Download, Settings2, Languages, Sparkles, FileAudio, Video, Music2, Users,
  Clock3, Search, Plus, Trash2, ChevronDown, PanelLeft, WandSparkles, ShieldCheck,
  CircleHelp, X, Check, AlertCircle, Subtitles, Mic2
} from 'lucide-react';
import './style.css';

const demoSegments = [
  {id:1, speaker:'Person 1', start:0.42, end:2.82, text:'Hey everyone, welcome back to the channel.', color:'#a78bfa'},
  {id:2, speaker:'Person 2', start:3.05, end:5.46, text:'Today we are going to try something new.', color:'#38bdf8'},
  {id:3, speaker:'Person 1', start:5.82, end:8.24, text:'Let’s get started with the video.', color:'#a78bfa'},
];
function fmt(s){s=Math.max(0,s||0);return `${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`}
function rulerTicks(d){
  if(!d) return {step:5,ticks:[0,5,10,15,20,25]};
  const steps=[1,2,5,10,15,30,60,120,300];
  const step=steps.find(s=>d/s<=8&&d/s>=3)||steps[steps.length-1];
  const ticks=[];for(let t=0;t<=d+0.001;t+=step)ticks.push(Math.round(t*100)/100);
  return {step,ticks};
}
function computePeaks(buf,buckets=240){
  const chans=buf.numberOfChannels, len=buf.length, out=new Array(buckets).fill(0);
  const per=Math.max(1,Math.floor(len/buckets));
  for(let b=0;b<buckets;b++){
    let peak=0;const start=b*per,end=Math.min(len,start+per);
    for(let c=0;c<chans;c++){const data=buf.getChannelData(c);for(let i=start;i<end;i+=4){const v=Math.abs(data[i]);if(v>peak)peak=v;}}
    out[b]=peak;
  }
  const max=Math.max(0.01,...out);return out.map(v=>v/max);
}
function encodeWAV(buffer){
  const chans=Math.min(2,buffer.numberOfChannels), sr=buffer.sampleRate, len=buffer.length;
  const bytes=44+len*chans*2, view=new DataView(new ArrayBuffer(bytes));
  const wstr=(o,s)=>{for(let i=0;i<s.length;i++)view.setUint8(o+i,s.charCodeAt(i))};
  wstr(0,'RIFF');view.setUint32(4,bytes-8,true);wstr(8,'WAVE');wstr(12,'fmt ');
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,chans,true);
  view.setUint32(24,sr,true);view.setUint32(28,sr*chans*2,true);view.setUint16(32,chans*2,true);
  view.setUint16(34,16,true);wstr(36,'data');view.setUint32(40,len*chans*2,true);
  let off=44;
  for(let i=0;i<len;i++)for(let c=0;c<chans;c++){
    let v=buffer.getChannelData(c)[i];v=Math.max(-1,Math.min(1,v));
    view.setInt16(off,v<0?v*0x8000:v*0x7FFF,true);off+=2;
  }
  return new Blob([view.buffer],{type:'audio/wav'});
}

function App(){
  const [file,setFile]=useState(null), [url,setUrl]=useState(''), [duration,setDuration]=useState(0);
  const [segments,setSegments]=useState(demoSegments), [selected,setSelected]=useState(1);
  const [current,setCurrent]=useState(0), [playing,setPlaying]=useState(false), [tab,setTab]=useState('Transcript');
  const [notice,setNotice]=useState(''); const [edited,setEdited]=useState(false);
  const [vol,setVol]=useState(0.8);
  const [audioBuf,setAudioBuf]=useState(null), [peaks,setPeaks]=useState(null);
  const [playEnd,setPlayEnd]=useState(null);
  const [showSettings,setShowSettings]=useState(false), [autosave,setAutosave]=useState(true);
  const [projKey,setProjKey]=useState(null);
  const videoRef=useRef(null), inputRef=useRef(null);
  const active=segments.find(s=>s.id===selected)||segments[0];

  useEffect(()=>{if(!file)return; const u=URL.createObjectURL(file);setUrl(u);return()=>URL.revokeObjectURL(u)},[file]);
  useEffect(()=>{const v=videoRef.current;if(!v)return;
    const onTime=()=>{setCurrent(v.currentTime||0);if(playEnd&&v.currentTime>=playEnd){v.pause();setPlaying(false);setPlayEnd(null);}};
    const onEnd=()=>setPlaying(false);
    v.addEventListener('timeupdate',onTime);v.addEventListener('ended',onEnd);
    return()=>{v.removeEventListener('timeupdate',onTime);v.removeEventListener('ended',onEnd)}},[url,playEnd]);
  useEffect(()=>{if(videoRef.current)videoRef.current.volume=vol},[vol,url]);
  useEffect(()=>{ // autosave edits for this video
    if(!projKey||!autosave||!edited)return;
    try{localStorage.setItem(projKey,JSON.stringify({segments,savedAt:Date.now()}))}catch(e){}
  },[segments,projKey,autosave,edited]);

  const togglePlay=()=>{const v=videoRef.current;if(!v)return;setPlayEnd(null);if(v.paused){v.play().then(()=>setPlaying(true)).catch(()=>{});}else{v.pause();setPlaying(false)}};
  const seek=(t)=>{setCurrent(t);if(videoRef.current)videoRef.current.currentTime=t};
  const playSegment=(s)=>{setPlayEnd(s.end);seek(s.start);const v=videoRef.current;if(v){v.play().then(()=>setPlaying(true)).catch(()=>{});}};
  const updateText=(text)=>{setSegments(a=>a.map(s=>s.id===selected?{...s,text}:s));setEdited(true)};
  const updateTiming=(field,val)=>{const t=parseFloat(val);if(isNaN(t))return;
    setSegments(a=>a.map(s=>{if(s.id!==selected)return s;
      let start=s.start,end=s.end;
      if(field==='start'){start=Math.max(0,Math.min(t,(duration||t)));if(start>=end)end=Math.min(duration||start+0.5,start+0.5);}
      else{end=Math.max(0,Math.min(t,duration||t));if(end<=start)start=Math.max(0,end-0.5);}
      return {...s,start,end};}));setEdited(true)};
  const addSegment=()=>{const id=Math.max(0,...segments.map(s=>s.id))+1;const s={id,speaker:'Person 1',start:current,end:Math.min(duration||current+2,current+2),text:'New transcript segment…',color:'#a78bfa'};setSegments(a=>[...a,s]);setSelected(id);setEdited(true)};
  const removeSegment=()=>{const rest=segments.filter(s=>s.id!==selected);setSegments(rest);setSelected(rest[0]?.id||0);setEdited(true)};

  const importFile=async(f)=>{
    if(!f)return;
    if(!f.type.startsWith('video/')){setNotice('Please choose a video file (MP4, MOV, WebM).');return;}
    setFile(f);setCurrent(0);setPlaying(false);setAudioBuf(null);setPeaks(null);setEdited(false);
    const key=`airi-proj:${f.name}`;setProjKey(key);
    let restored=false;
    try{const saved=localStorage.getItem(key);if(saved){const p=JSON.parse(saved);if(p&&Array.isArray(p.segments)){setSegments(p.segments);setSelected(p.segments[0]?.id||0);restored=true;}}}catch(e){}
    if(!restored){setSegments([]);setSelected(0);}
    setNotice(restored?'Video loaded locally. Restored your saved edits for this file.':'Video loaded locally. No upload to a server.');
    try{
      const ctx=new (window.AudioContext||window.webkitAudioContext)();
      const buf=await ctx.decodeAudioData(await f.arrayBuffer());
      setAudioBuf(buf);setPeaks(computePeaks(buf));ctx.close();
    }catch(e){setNotice('Video loaded. Its audio track could not be decoded for waveforms/trim in this browser; playback still works.');}
  };

  const exportTranscript=()=>{const blob=new Blob([JSON.stringify({video:file?.name||null,segments},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='airi-transcript.json';a.click();URL.revokeObjectURL(a.href);};
  const exportSegmentWav=()=>{
    if(!audioBuf){setNotice('Trim needs a decodable audio track. This file\'s audio could not be decoded in this browser.');return;}
    if(!active){setNotice('Select or add a segment to trim.');return;}
    const sr=audioBuf.sampleRate;
    const s=Math.max(0,Math.floor(active.start*sr)), e=Math.min(audioBuf.length,Math.ceil(active.end*sr));
    if(e<=s){setNotice('Segment is empty - check its start/end times.');return;}
    const out=new AudioBuffer({numberOfChannels:audioBuf.numberOfChannels,length:e-s,sampleRate:sr});
    for(let c=0;c<audioBuf.numberOfChannels;c++){const src=audioBuf.getChannelData(c),dst=out.getChannelData(c);for(let i=0;i<e-s;i++)dst[i]=src[s+i]*vol;}
    const blob=encodeWAV(out);
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download=`${(file?.name||'audio').replace(/\.[^.]+$/,'')}-segment-${active.id}.wav`;a.click();URL.revokeObjectURL(a.href);
    setNotice(`Segment ${active.id} audio exported as WAV (${fmt(active.start)} - ${fmt(active.end)}). Video trimming is not included.`);
  };
  const clearSaved=()=>{if(projKey){try{localStorage.removeItem(projKey)}catch(e){}}setSegments([]);setSelected(0);setEdited(false);setShowSettings(false);setNotice('Saved edits for this video cleared.');};

  const {step,ticks}=rulerTicks(duration);
  const tickPct=duration?`${(step/duration)*100}% 100%`:'20% 100%';
  const segPeaks=(s)=>{if(!peaks||!duration)return null;
    const a=Math.floor((s.start/duration)*peaks.length), b=Math.max(a+2,Math.ceil((s.end/duration)*peaks.length));
    return peaks.slice(a,b);};

  return <div className="app">
    <header className="topbar">
      <div className="brand"><div className="brandmark"><AudioLines size={20}/></div><div><b>AIRI</b><span>VOICE STUDIO</span></div></div>
      <div className="top-center"><span className="project-dot"/>{file?file.name:'No project loaded'}</div>
      <div className="top-actions">
        <span className="local-pill"><ShieldCheck size={12}/> LOCAL ONLY</span>
        <div className="settings-wrap">
          <button className="icon-btn" title="Settings" onClick={()=>setShowSettings(v=>!v)}><Settings2 size={16}/></button>
          {showSettings&&<div className="settings-pop">
            <b>Settings</b>
            <label className="set-row"><input type="checkbox" checked={autosave} onChange={e=>setAutosave(e.target.checked)}/> Autosave edits in this browser</label>
            <button className="set-clear" onClick={clearSaved} disabled={!projKey}>Clear saved edits for this video</button>
            <small>Everything stays on this device. No account, no upload.</small>
          </div>}
        </div>
        <button className="export-btn" onClick={exportTranscript}><Download size={15}/> Export</button>
      </div>
    </header>
    <main className="workspace">
      <aside className="sidebar">
        <div className="side-label">WORKSPACE</div>
        <button className="side-item active"><PanelLeft size={17}/> Editor</button>
        <button className="side-item" onClick={()=>setTab('Transcript')}><Subtitles size={17}/> Transcript</button>
        <button className="side-item" onClick={()=>setTab('Audio')}><AudioLines size={17}/> Audio tracks</button>
        <div className="side-label second">PROJECT</div>
        <div className="project-mini"><Video size={16}/><span>{file?file.name:'No video imported'}</span></div>
        <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={17}/><div><b>Getting started</b><small>Import a video, add segments at the playhead, edit text, export transcript or segment audio.</small></div></div><div className="version">AIRi Studio · 0.2</div></div>
      </aside>
      <section className="main-area">
        <div className="editor-head"><div><h1>Video editor</h1><p>Review your video and edit speaker transcripts.</p></div><div className="head-tools"><button className="outline-btn" onClick={()=>inputRef.current?.click()}><Upload size={15}/> Import video</button><input ref={inputRef} type="file" accept="video/*" hidden onChange={e=>importFile(e.target.files?.[0])}/><button className="outline-btn" onClick={()=>setNotice('AI transcription is not connected in this version yet. Segments are added manually at the playhead.')}><Sparkles size={15}/> AI transcribe</button></div></div>
        <div className="preview-card">
          <div className="preview-toolbar"><span><Video size={14}/> PREVIEW</span><span className="preview-resolution">FIT <ChevronDown size={12}/></span></div>
          <div className="video-stage">
            {url?<video ref={videoRef} src={url} onLoadedMetadata={e=>setDuration(e.target.duration||0)} controls={false} />:
            <div className="empty-video"><div className="empty-icon"><Upload size={25}/></div><b>Drop a video to start</b><span>or import a file from your device</span><button onClick={()=>inputRef.current?.click()}>Choose video</button><small>Files stay on this device</small></div>}
          </div>
          <div className="player-controls"><button onClick={()=>seek(Math.max(0,current-5))}><SkipBack size={17}/></button><button className="play-btn" onClick={togglePlay}>{playing?<Pause size={17} fill="currentColor"/>:<Play size={17} fill="currentColor"/>}</button><button onClick={()=>seek(Math.min(duration,current+5))}><SkipForward size={17}/></button><span className="timecode">{fmt(current)} <em>/</em> {fmt(duration)}</span><div className="player-spacer"/><Volume2 size={16}/><input className="volume-slider" type="range" min="0" max="1" step="0.01" value={vol} onChange={e=>setVol(parseFloat(e.target.value))} title="Volume"/><button onClick={()=>videoRef.current?.requestFullscreen?.()} title="Fullscreen"><PanelLeft size={16}/></button></div>
        </div>
        <div className="timeline-card">
          <div className="timeline-header"><div className="tabs"><button className={tab==='Transcript'?'selected':''} onClick={()=>setTab('Transcript')}><Subtitles size={14}/> Transcript</button><button className={tab==='Audio'?'selected':''} onClick={()=>setTab('Audio')}><AudioLines size={14}/> Audio tracks</button></div><div className="timeline-actions"><button title="Add segment at playhead" onClick={addSegment}><Plus size={15}/></button><button title="Export selected segment audio (WAV)" onClick={exportSegmentWav}><Scissors size={15}/></button></div></div>
          <div className="ruler" style={{backgroundSize:tickPct}}>{ticks.map(t=><span key={t}>{fmt(t)}</span>)}</div>
          <div className="track-row"><div className="track-name"><Video size={14}/> Video</div><div className="track-lane" style={{backgroundSize:tickPct}}><div className="video-clip" style={{width:duration?'calc(100% - 8px)':'68%'}}>{file?.name||'Import a video'}</div></div></div>
          <div className="track-row"><div className="track-name"><Music2 size={14}/> Original</div><div className="track-lane" style={{backgroundSize:tickPct}}><div className="audio-clip original"><Wave peaks={peaks}/></div></div></div>
          {segments.map(s=><div className="track-row" key={s.id}><div className="track-name"><Mic2 size={14} style={{color:s.color}}/>{s.speaker}</div><div className="track-lane" style={{backgroundSize:tickPct}}><button className={`voice-clip ${selected===s.id?'chosen':''}`} style={{left:`${duration?Math.min(96,s.start/duration*100):s.start*4}%`,width:`${duration?Math.max(3,(s.end-s.start)/duration*100):15}%`,borderColor:s.color,background:`${s.color}22`}} onClick={()=>{setSelected(s.id);seek(s.start)}}><Wave peaks={segPeaks(s)} color={s.color}/></button></div></div>)}
          <div className="playhead" style={{left:`calc(160px + ${duration?Math.min(100,current/duration*100):current*4}% )`}}><div/></div>
          <div className="timeline-footer"><span><Clock3 size={13}/> {duration?fmt(duration):'00:00'} total · {segments.length} segment{segments.length===1?'':'s'}</span><span>Timeline · local preview{edited&&autosave&&projKey?' · edits saved in browser':''}</span></div>
        </div>
      </section>
      <aside className="inspector">
        <div className="inspector-title"><h2>Inspector</h2><button className="icon-btn" onClick={()=>setShowSettings(v=>!v)}><Settings2 size={16}/></button></div>
        <div className="inspector-tabs"><button className="active">Segment</button><button onClick={()=>setTab('Audio')}>Audio</button></div>
        {active?<React.Fragment>
          <div className="section-label">TRANSCRIPT TEXT</div><div className="text-editor"><textarea value={active.text} onChange={e=>updateText(e.target.value)} placeholder="Type the spoken words for this segment…"/><div className="text-meta"><span><Languages size={12}/> Manual transcript</span><span>{active.text.length} chars</span></div></div>
          <div className="section-label">SEGMENT TIMING</div><div className="timing-grid"><label>Start <input value={active.start.toFixed(2)} onChange={e=>updateTiming('start',e.target.value)}/></label><label>End <input value={active.end.toFixed(2)} onChange={e=>updateTiming('end',e.target.value)}/></label></div>
          <button className="wide-secondary" onClick={()=>playSegment(active)}><Play size={14}/> Play this segment</button>
          <button className="wide-secondary" onClick={exportSegmentWav}><Scissors size={14}/> Trim & export segment audio (WAV)</button>
          <div className="section-label">VOICE</div><div className="voice-setting"><div className="voice-icon"><Mic2 size={16}/></div><div><b>Original speaker voice</b><small>Voice cloning not connected</small></div><span className="lock">LOCAL</span></div>
          <button className="wide-primary" onClick={()=>setNotice('Voice regeneration requires an on-device voice model, which is not connected in this version. No audio was changed.') }><WandSparkles size={15}/> Regenerate voice <span>↗</span></button>
          <button className="delete-btn" onClick={removeSegment}><Trash2 size={14}/> Remove segment</button>
        </React.Fragment>:<div className="empty-inspector">{file?'Add a segment at the playhead, then select it to edit.':'Import a video, then add a transcript segment.'}</div>}
        <div className="inspector-bottom"><ShieldCheck size={14}/> <span>Media remains on your device</span></div>
      </aside>
    </main>
    <footer className="statusbar"><span><span className="status-dot"/> Ready</span><span>Browser-based · No account{autosave?' · Autosave on':' · Autosave off'}</span><span>RAM requirement: 4GB+ (recommended 8GB)</span></footer>
    {notice&&<div className="toast"><AlertCircle size={16}/>{notice}<button onClick={()=>setNotice('')}><X size={15}/></button></div>}
  </div>
}
function Wave({peaks,color='currentColor'}){
  const bars=peaks&&peaks.length?peaks:Array.from({length:45},(_,i)=>0.08+Math.abs(Math.sin(i*1.7)*Math.cos(i*.3))*0.78);
  return <div className="wave" aria-hidden="true">{bars.map((p,i)=><i key={i} style={{height:`${Math.max(6,Math.round(p*92))}%`,background:color}}/>)}</div>
}
createRoot(document.getElementById('root')).render(<App/>);
