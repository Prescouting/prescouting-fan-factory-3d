# Ática y Vesper — diagnóstico técnico 26/10/2026

Estado: **NO APROBADOS / NO APTOS PARA RIGGING DE PRODUCCIÓN**.

Las geometrías `style-rebuild/preview/*.glb` y `style-rebuild/models-3d/*.glb` son prototipos visuales, no avatares preparados para animación.
Las pruebas `style-rebuild/rig-lab/*-rigged-experimental.blend` tampoco están aprobadas: las rotaciones de huesos no producen movimientos naturales de cuerpo/ropa.

## Comprobación reproducible
- Ática: cráneo original, 17.632 vértices y **547 componentes desconectados**. Melena: 33.465 vértices y **763 componentes**. Brazos y manos: 2.762 vértices y **183 componentes**.
- Vesper: cráneo original, 4.733 vértices y **110 componentes desconectados**. Pelo: 17.612 vértices y **473 componentes**. Brazos y manos: 1.070 vértices y **7 componentes**.
- La escena Blender contenía además 37 objetos de cara anatómica superpuestos en Ática. Quitarlos no modificó en absoluto el GLB ya publicado (SHA256 idéntico): la duplicación visible también está incorporada en la geometría/material del cráneo original.
- Sustituir el cráneo original por la cara anatómica y escalarla/posicionarla produjo peores resultados, con diferencias de escala y texturas. Prueba rechazada, NO desplegada.

## Condiciones antes de volver a publicar como modelo final
1. Una sola cabeza 3D coherente por personaje, sin dobles ojos, mandíbulas o nariz. Cara acorde al diseño aprobado.
2. Malla continua / topología controlada para todas las superficies sujetas a deformación. Pelo y accesorios pueden ser piezas separadas de forma intencionada.
3. Pose A neutra; mangas y piernas separadas, articulaciones con loops limpios y prendas independientes.
4. Rig con pesos probados fotograma a fotograma en hombros, codos, caderas, rodillas y tobillos.
5. Clips de idle, saludo, celebración y marcha visualmente verificados en Blender Y en el visor web, sin estiramientos de texturas ni partes duplicadas.
6. No sustituir ni añadir los modelos a LA GRADA ni comercializarlos antes de pasar validación visual.

No convertir automáticamente los archivos de prototipo en versión aprobada ni volver a regenerarlos con geometría procedural Minecraft.
