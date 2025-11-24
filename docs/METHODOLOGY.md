# Metodología de Desarrollo en VaultLocker

## Enfoque
- Tipo: mixto (cualitativo + cuantitativo) orientado a seguridad (Security-by-Design).
- Marco de trabajo: ágil ligero (Scrum/Kanban) con puertas de seguridad en cada iteración.
- Artefactos de entrada: Excel de requerimientos/hardware/planificación, backlog priorizado, políticas de seguridad (OWASP, NIST, MV3).

## Cómo se investiga y decide
- Cualitativo: entrevistas con usuarios/soporte, revisión de políticas y flujos reales, inspección manual de permisos y UX.
- Cuantitativo: métricas de errores, rendimiento, cobertura de tests, hallazgos SAST/DAST, tiempos de respuesta y uso de memoria en la extensión/backend.

## Pasos del proceso
1) Descubrimiento y contexto: validar alcance y restricciones (políticas Chrome Web Store, OWASP, NIST), inventario de hardware/infra (Excel).
2) Levantamiento y priorización: clasificar requerimientos en must/should/could, riesgos y dependencias técnicas.
3) Diseño y arquitectura: modelo de amenazas, decisión de cifrado (WebCrypto + Argon2/PBKDF2), permisos mínimos MV3, contratos de API NestJS.
4) Planificación ágil: backlog refinado, estimaciones, criterios de aceptación funcionales y de seguridad por historia.
5) Implementación iterativa: desarrollo frontend/extensión/backend, revisiones de código, linters y tests automáticos.
6) Verificación: pruebas unitarias/integración, SAST/DAST, revisión de permisos/CSP, validación de entornos y hardware.
7) Despliegue y observabilidad: builds firmadas, CI/CD, monitoreo de errores/performance, rotación de secretos.
8) Feedback y mejora continua: retro con usuarios y soporte, análisis de métricas, ajuste de backlog y controles.

## Mapa de proceso (flujo resumido)
Requerimientos (Excel) → Priorización → Diseño/Seguridad → Planificación Sprint → Desarrollo → Pruebas (funcional + seguridad) → Despliegue → Feedback/Retro

## Roles y responsables
- Producto/Seguridad: define alcance, criterios de aceptación y controles mínimos.
- Desarrollo: implementa, revisa código y mantiene calidad técnica.
- QA/Seguridad: ejecuta pruebas funcionales y de seguridad (SAST/DAST), valida permisos y políticas.
- DevOps: CI/CD, monitoreo, gestión de secretos y entornos.

## Métricas clave
- Seguridad: hallazgos abiertos/cerrados (SAST/DAST), tiempo de parcheo, reducción de permisos.
- Calidad: cobertura de tests, defectos por iteración, tiempo medio de resolución de bugs.
- Rendimiento: tiempos de respuesta API, uso de memoria en extensión, latencia percibida en UI.
- Entrega: lead time de cambios y predictibilidad de sprints.

## Notas
- El enfoque es incremental; las puertas de seguridad son obligatorias antes de liberar.
- Las métricas se revisan en retros para ajustar prioridades y controles.
