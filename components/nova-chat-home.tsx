"use client";

import dynamic from "next/dynamic";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { Keyboard, Mic, Paperclip, Send, ShieldCheck, X } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { SpeechInput } from "@/components/ai-elements/speech-input";

const NovaScene = dynamic(() => import("@/components/ios-orb"), { ssr: false, loading: () => <div className="nova-core-loading"><i/></div> });
export function NovaChatHome() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/nova/chat" }), []);
  const { messages, sendMessage, status, stop, error } = useChat({ transport });
  const hasConversation = messages.length > 0;
  const isThinking = status === "submitted" || status === "streaming";
  const [isListening, setIsListening] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const submit = async (text: string) => { const value=text.trim(); if(value) await sendMessage({ text:value }); };

  return <div className={`nova-chat-home ${hasConversation ? "has-conversation" : "is-empty"}`}>
    <div className="chat-ambient"><i/><i/><i/></div>
    {hasConversation ? <header className="chat-home-header"><div><span>NOVA EXECUTIVE</span><b>{isThinking ? "Analyse en cours" : "Prête à orchestrer"}</b></div><div className="chat-home-live"><i/> IA en ligne</div></header> : null}

    {hasConversation ? <section className="chat-stream">
      <div className={`chat-mini-core ${isThinking ? "thinking" : ""}`}><div className="chat-mini-scene"><NovaScene/></div><span>{isThinking ? "NOVA réfléchit et coordonne ses agents" : "NOVA Executive"}</span></div>
      <Conversation className="chat-conversation"><ConversationContent>
        {messages.map(message => <Message from={message.role} key={message.id}><MessageContent>{message.parts.map((part,index)=>part.type==="text"?<MessageResponse key={index}>{part.text}</MessageResponse>:null)}</MessageContent></Message>)}
        {error ? <div className="chat-error">NOVA n’a pas pu terminer cette réponse. Réessayez dans quelques instants.</div> : null}
      </ConversationContent><ConversationScrollButton/></Conversation>
    </section> : <section className={`voice-home ${isListening ? "listening" : ""}`}>
      <div className="voice-glass-orbit o1"/><div className="voice-glass-orbit o2"/><div className="voice-glass-orbit o3"/>
      <div className="voice-sphere" aria-label="NOVA, assistant vocal">
        <div className="voice-sphere-aura"/><NovaScene/>
        <SpeechInput className="voice-trigger" lang="fr-FR" aria-label="Parler à NOVA" onListeningChange={setIsListening} onTranscriptionChange={(text)=>{setIsListening(false);void submit(text)}}/>
      </div>
      <div className="voice-wave" aria-hidden="true">{Array.from({length:17},(_,index)=><i key={index} style={{"--wave":index} as React.CSSProperties}/>)}</div>
      <button className="keyboard-trigger" aria-label="Écrire à NOVA" onClick={()=>setShowKeyboard(value=>!value)}>{showKeyboard?<X/>:<Keyboard/>}</button>
    </section>}

    {hasConversation || showKeyboard ? <div className="chat-command-dock"><PromptInput onSubmit={({text})=>submit(text)}>
      <PromptInputBody><PromptInputTextarea placeholder="Demandez quelque chose à NOVA…"/></PromptInputBody>
      <PromptInputFooter><div className="dock-tools"><button type="button" aria-label="Ajouter une pièce jointe"><Paperclip/></button><button type="button" aria-label="Utiliser la voix"><Mic/></button><span><ShieldCheck/> Actions sensibles sous contrôle</span></div><PromptInputSubmit status={status} onStop={stop}><Send/></PromptInputSubmit></PromptInputFooter>
    </PromptInput>{hasConversation ? <p>NOVA peut se tromper. Les actions externes nécessitent des connecteurs et vos autorisations.</p> : null}</div> : null}
  </div>;
}
