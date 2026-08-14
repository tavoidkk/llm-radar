# Provider logos

Coloca aquí los SVG oficiales (24×24 viewBox recomendado) con el nombre de archivo
exacto en minúsculas y snake/kebab-case. La app los sirve en
`/providers/<slug>.svg` desde `ProviderLogo`.

## Nombres de archivo esperados

| Provider (en la app)        | Archivo                  |
| --------------------------- | ------------------------ |
| OpenAI                      | `openai.svg`             |
| Anthropic                   | `anthropic.svg`          |
| Google                      | `google.svg`             |
| Meta                        | `meta.svg`               |
| Mistral / Mistral AI        | `mistral.svg`            |
| DeepSeek                    | `deepseek.svg`           |
| Cohere                      | `cohere.svg`             |
| Perplexity                  | `perplexity.svg`         |
| xAI / x-ai                  | `xai.svg`                |
| Groq                        | `groq.svg`               |
| NVIDIA                      | `nvidia.svg`             |
| Microsoft                   | `microsoft.svg`          |
| Amazon                      | `amazon.svg`             |
| Alibaba / Qwen              | `alibaba.svg`            |
| AI21                        | `ai21.svg`               |
| OpenRouter                  | `openrouter.svg`         |
| Moonshot                    | `moonshot.svg`           |
| Zhipu                       | `zhipu.svg`              |
| 01.AI                       | `01-ai.svg`              |
| MiniMax                  | `minimax.svg`         |

Para cualquier otro provider que no esté en esta tabla, el componente cae
al fallback: badge con la inicial sobre el color de marca.

## Especificaciones

- `viewBox="0 0 24 24"`, idealmente sin `width`/`height` fijos (o 24×24).
- Fondo transparente. El componente aplica el tamaño en el render.
- Color de marca como relleno o trazo monocromo. Sin texto ya que el componente
  muestra el nombre del modelo en la fila.
- Si el SVG declara `fill`/`stroke`, deja el color de marca; el componente
  hereda `currentColor` cuando es posible.

## Dónde descargar

- **Simple Icons** (recomendado, MIT, monocromáticos): https://simpleicons.org/
  → descarga directa en https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/<slug>.svg
  (slugs en kebab-case; ej. `openai`, `anthropic`, `googlegemini`, `meta`,
  `mistralai`, `deepseek`, `cohere`, `perplexity`, `xai`, `groq`, `nvidia`,
  `microsoft`, `amazon`, `alibabacloud`, `openrouter`).
- **Brandfetch** (color oficial): https://brandfetch.com/ → busca el proveedor →
  descarga SVG. Renombra al slug de la tabla.
- **Wikimedia Commons** para marcas con copyright: https://commons.wikimedia.org/
- **Páginas oficiales** del proveedor (press kits).

## Cómo añadir un provider nuevo

1. Suelta el SVG en esta carpeta con el slug correcto.
2. Si el nombre del provider en la DB no coincide con la clave del mapa
   `PROVIDER_SLUG` en `frontend/src/lib/logos.tsx`, añade la entrada ahí.
3. Si quieres un color de marca para el fallback del badge, añade la entrada
   en `PROVIDER_BRAND_COLOR`.

Los placeholders actuales son cuadrados de color con la inicial — **reemplázalos
por las marcas oficiales**.
