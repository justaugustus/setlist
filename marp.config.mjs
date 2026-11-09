// Single newlines in the Markdown source are soft wraps, not line breaks.
export default {
  inputDir: './decks',
  output: './_site',
  options: { markdown: { breaks: false } },
}
