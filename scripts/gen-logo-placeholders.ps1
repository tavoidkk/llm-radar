$slugs = @('openai','anthropic','google','meta','mistral','deepseek','cohere','perplexity','xai','groq','nvidia','microsoft','amazon','alibaba','ai21','openrouter','moonshot','zhipu','01-ai','minimax')
$colors = @{
  openai='#10A37F';anthropic='#D97757';google='#4285F4';meta='#0668E1';mistral='#FA520F';
  deepseek='#4D6BFE';cohere='#39594D';perplexity='#20B8CD';xai='#f8fafc';groq='#F55036';
  nvidia='#76B900';microsoft='#00A4EF';amazon='#FF9900';alibaba='#FF6A00';ai21='#FC6400';
  openrouter='#8b8b8b';moonshot='#4D6BFE';zhipu='#3B5AF2';'01-ai'='#5B8DEF';minimax='#7C3AED'
}
foreach ($s in $slugs) {
  $c = $colors[$s]
  $letter = $s.Substring(0,1).ToUpper()
  $textFill = if ($c -eq '#f8fafc') { '#0b0f17' } else { '#ffffff' }
  $svg = @"
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
  <rect width="24" height="24" rx="4" fill="$c"/>
  <text x="12" y="17" font-family="ui-sans-serif,system-ui,sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="$textFill">$letter</text>
</svg>
"@
  Set-Content -LiteralPath "frontend\public\providers\$s.svg" -Value $svg -Encoding UTF8 -NoNewline
}
Write-Output "Generated $(($slugs).Count) placeholder SVGs"
