import { Box } from '@mui/material';

type HtmlContentProps = {
  html: string;
};

export function HtmlContent({ html }: HtmlContentProps) {
  return (
    <Box
      className="cms-html-content"
      sx={{
        '& h2': { mt: 3, mb: 1.5 },
        '& h3': { mt: 2, mb: 1 },
        '& p': { mb: 1.5 },
        '& ul, & ol': { pl: 3, mb: 1.5 },
        '& a': { color: 'primary.main' },
        '& table': { width: '100%', borderCollapse: 'collapse', mb: 2 },
        '& th, & td': { border: '1px solid', borderColor: 'divider', p: 1 },
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
