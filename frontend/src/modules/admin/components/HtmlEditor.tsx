import { Box, Button, ButtonGroup, Paper } from '@mui/material';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

type HtmlEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

export function HtmlEditor({ value, onChange }: HtmlEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      <ButtonGroup size="small" sx={{ mb: 1, flexWrap: 'wrap' }}>
        <Button onClick={() => editor.chain().focus().toggleBold().run()}>Bold</Button>
        <Button onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</Button>
        <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Button>
        <Button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </Button>
        <Button onClick={() => editor.chain().focus().toggleBulletList().run()}>List</Button>
        <Button onClick={() => editor.chain().focus().toggleOrderedList().run()}>Numbered</Button>
      </ButtonGroup>
      <Box
        sx={{
          minHeight: 240,
          '& .ProseMirror': { outline: 'none', minHeight: 220, px: 1 },
          '& .ProseMirror p': { m: 0, mb: 1 },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
}
