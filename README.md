# Shader portfolio

Portfolio de una pantalla en Next.js + TypeScript. WebGL nativo, sin Three.js ni motor de escenas.

```sh
npm install
npm run dev
```

Abrí http://localhost:3000. Para producción: `npm run build` y `npm start`.

## Contenido

El perfil está completo con información pública de https://github.com/LautiLosio y su README de perfil: Lautaro Losio, nombre visible Lauti, perfil frontend sin empleador, stack y email público. LinkedIn fue confirmado por el usuario. Editá `src/lib/profile.ts` para actualizar la bio, links y proyectos seleccionados.

Inicio, Sobre mí, Proyectos y Contacto cambian el contenido centrado sin scroll. Los controles funcionan con teclado; el texto no se puede seleccionar según el brief. El pie solo conserva el control de pausa, sin indicaciones ni avisos de muestra.

## Shader

`reference/android-original.frag` conserva la fuente original. `src/lib/shader.ts` contiene el port. Se conservan noise, warp, viento, puntos y separación RGB vertical real del código original. GREEN_SPLIT en el original no tiene uso y su comentario describe otra geometría.

Cambios:

- Estado del gesto en CPU con interpolación exponencial. No se necesitan backbuffer ni ping-pong textures.
- Coordenadas de la grilla, ruido y gestos normalizadas al lado corto. Una pantalla ancha muestra más campo; no estira puntos. Eliminado el segundo ajuste de aspecto del ruido original.
- Tiempo y fade en segundos, independientes de FPS. La animación se suspende en segundo plano y al perder foco; no salta al reanudar.
- Un triángulo y una llamada de dibujo por frame. Una capa en reposo y fuera del gesto, tres únicamente en su área.
- Máximo 60 renders/s, DPR máximo 2 y presupuesto de 4 millones de píxeles en escritorio; DPR 1.5 y 1.6 millones en móvil. Si la cadencia queda por debajo de 42 FPS en una ventana de 3 s, el factor de calidad baja hasta 0.5, pero la resolución efectiva tiene un piso de un píxel de render por píxel CSS salvo que el tamaño supere el presupuesto máximo. La señal mide cadencia de frames, no tiempo GPU exacto. La calidad nunca altera las coordenadas lógicas.
- WebGL sin antialiasing, profundidad ni stencil. Reduced motion y Pausar dejan una imagen estática sin un loop activo. Restauración del contexto WebGL y fondo negro si no está disponible.
- Mouse sin clic: impulso de velocidad integrado por frame y amortiguado a cero cuando queda quieto. Touch/pen con arrastre vía Pointer Events. Un puntero controla el gesto. pointercancel, blur y resize eliminan gestos colgados. Los enlaces y botones no inician arrastre.

La consistencia es de escala, no una composición idéntica en todos los formatos: se expande el campo según la pantalla. Es una decisión deliberada respecto del Android original de 70 columnas siempre.

## Validación de rendimiento

No asumir FPS universales. Medir en Android Chrome y iOS Safari reales, especialmente durante RGB. En DevTools revisar frames, energía, memoria y resolución del canvas. Probar retrato/paisaje, DPR alto, pestaña oculta, cambio de tamaño, reducción de movimiento, WebGL deshabilitado y context loss. Los tests de escritorio con software rendering no representan una GPU móvil.

## GitHub y Vercel

El proyecto tiene Git local. Creá un repositorio, agregá el remote y subilo. En Vercel importá ese repositorio con preset Next.js; no necesita variables de entorno ni backend. El contenido se prerenderiza y el shader se ejecuta en el navegador. `next/font` descarga Manrope en build y luego la sirve desde el mismo sitio.

## Dependencias

El audit inicial reporta 5 alertas altas en dependencias transitivas del tooling ESLint, vía braces; el registry no ofrece una versión parcheada de braces al momento de crear este proyecto. No ejecutar `audit fix --force` porque propone bajar Next ESLint a 14. El audit de dependencias de producción se verifica por separado.

## Aspecto del fondo

Escritorio usa 140 celdas en el lado corto y móvil 70. Conservan radio máximo 0.5, gris 0.35 y suavidad 0.1. Threshold 0.1 y transición 0.7, por pedido del usuario. No se cambia la suavidad para achicar puntos; se aumenta únicamente la densidad de la grilla. En pantallas Retina, el render usa hasta DPR 2 con un piso de resolución para evitar pixelación.

## Acceso desde el celular

En la misma Wi-Fi: http://192.168.100.8:3000. Next dev permite ese host mediante allowedDevOrigins para que recursos/HMR no se bloqueen. Si cambia la IP del equipo, actualizar el host en next.config.ts. No es una configuración de producción.

Nombre visible: Lauti. El cursor usa el impulso original con ganancia 15 en lugar de 3. Se eliminó la activación saturada y el segundo suavizado; la distorsión decae exponencialmente desde el primer frame sin movimiento, con constante de 0.18 s.

La bio evita referencias al empleador por pedido del usuario. Proyectos incluye los cuatro dominios lauti.dev confirmados por el usuario, junto a los repositorios seleccionados.
