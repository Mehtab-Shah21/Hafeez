import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Heading3, ImageIcon, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

/** TipTap editor for blog bodies. Output HTML is sanitised again on the server (sanitize-html). */
export default function RichText({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Link.configure({ openOnClick: false, autolink: true }), Image],
    content: value,
    editorProps: { attributes: { class: 'prose-site min-h-64 rounded-b-lg border border-t-0 border-mist bg-white p-4 focus:outline-none', dir: 'auto' } },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    immediatelyRender: false,
  });
  // Switching EN/AR tabs keeps separate editors; sync external resets (e.g. load) only.
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) editor.commands.setContent(value, false);
  }, [value, editor]);
  if (!editor) return null;
  const B = ({ on, active, label, children }: { on: () => void; active?: boolean; label: string; children: React.ReactNode }) => (
    <button type="button" onClick={on} aria-label={label} aria-pressed={active} className={cn('grid size-8 place-items-center rounded-md text-navy hover:bg-offwhite [&_svg]:size-4', active && 'bg-navy text-white hover:bg-navy')}>
      {children}
    </button>
  );
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-mist bg-offwhite/60 p-1" role="toolbar" aria-label="Formatting">
        <B label="Heading 2" active={editor.isActive('heading', { level: 2 })} on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 />
        </B>
        <B label="Heading 3" active={editor.isActive('heading', { level: 3 })} on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 />
        </B>
        <B label="Bold" active={editor.isActive('bold')} on={() => editor.chain().focus().toggleBold().run()}>
          <Bold />
        </B>
        <B label="Italic" active={editor.isActive('italic')} on={() => editor.chain().focus().toggleItalic().run()}>
          <Italic />
        </B>
        <B label="Bullet list" active={editor.isActive('bulletList')} on={() => editor.chain().focus().toggleBulletList().run()}>
          <List />
        </B>
        <B label="Numbered list" active={editor.isActive('orderedList')} on={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered />
        </B>
        <B label="Quote" active={editor.isActive('blockquote')} on={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote />
        </B>
        <B
          label="Link"
          active={editor.isActive('link')}
          on={() => {
            const url = window.prompt('Link URL (https://… or /en/…)', editor.getAttributes('link').href as string | undefined);
            if (url === null) return;
            if (url === '') editor.chain().focus().unsetLink().run();
            else editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <Link2 />
        </B>
        <B
          label="Image"
          on={() => {
            const src = window.prompt('Image URL (copy it from Admin → Media)');
            const alt = src ? window.prompt('Alt text (describe the image)') : null;
            if (src && alt) editor.chain().focus().setImage({ src, alt }).run();
          }}
        >
          <ImageIcon />
        </B>
        <span className="mx-1 w-px bg-mist" />
        <B label="Undo" on={() => editor.chain().focus().undo().run()}>
          <Undo2 />
        </B>
        <B label="Redo" on={() => editor.chain().focus().redo().run()}>
          <Redo2 />
        </B>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
