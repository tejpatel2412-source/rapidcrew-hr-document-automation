'use client';
import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, List, ListOrdered, Redo2, Underline as UnderlineIcon, Undo2 } from 'lucide-react';

export default function RichTextEditor({value,onChange}:{value:string;onChange:(html:string)=>void}){
 const editor=useEditor({immediatelyRender:false,extensions:[StarterKit,Underline,TextAlign.configure({types:['heading','paragraph']})],content:value,onUpdate:({editor})=>onChange(editor.getHTML()),editorProps:{attributes:{class:'min-h-64 rounded-b-lg bg-white p-4 text-sm leading-6 focus:outline-none'}}});
 useEffect(()=>{if(editor&&value!==editor.getHTML())editor.commands.setContent(value,false)},[value,editor]);
 if(!editor)return <div className="min-h-64 rounded-lg border bg-white"/>;
 const tool=(label:string,active:boolean,fn:()=>void,icon:React.ReactNode)=><button type="button" aria-label={label} title={label} onClick={fn} className={`rounded p-1.5 ${active?'bg-red-50 text-[#8B0000]':'text-gray-600 hover:bg-gray-100'}`}>{icon}</button>;
 return <div className="rounded-lg border border-gray-300 bg-white"><div className="flex flex-wrap gap-1 border-b bg-gray-50 p-2">{tool('Bold',editor.isActive('bold'),()=>editor.chain().focus().toggleBold().run(),<Bold size={16}/>)}{tool('Italic',editor.isActive('italic'),()=>editor.chain().focus().toggleItalic().run(),<Italic size={16}/>)}{tool('Underline',editor.isActive('underline'),()=>editor.chain().focus().toggleUnderline().run(),<UnderlineIcon size={16}/>)}{tool('Bullet list',editor.isActive('bulletList'),()=>editor.chain().focus().toggleBulletList().run(),<List size={16}/>)}{tool('Numbered list',editor.isActive('orderedList'),()=>editor.chain().focus().toggleOrderedList().run(),<ListOrdered size={16}/>)}{tool('Left align',editor.isActive({textAlign:'left'}),()=>editor.chain().focus().setTextAlign('left').run(),<AlignLeft size={16}/>)}{tool('Center align',editor.isActive({textAlign:'center'}),()=>editor.chain().focus().setTextAlign('center').run(),<AlignCenter size={16}/>)}{tool('Right align',editor.isActive({textAlign:'right'}),()=>editor.chain().focus().setTextAlign('right').run(),<AlignRight size={16}/>)}{tool('Justify',editor.isActive({textAlign:'justify'}),()=>editor.chain().focus().setTextAlign('justify').run(),<AlignJustify size={16}/>)}{tool('Undo',false,()=>editor.chain().focus().undo().run(),<Undo2 size={16}/>)}{tool('Redo',false,()=>editor.chain().focus().redo().run(),<Redo2 size={16}/>)}</div><EditorContent editor={editor}/></div>
}
