d# Especificaciones Técnicas: The Lazy DM Vault (v1.0)

## 1. Visión del Producto

Una aplicación de escritorio (local-first) para Dungeon Masters basada en la metodología "Return of the Lazy Dungeon Master". La aplicación permite gestionar múltiples campañas aisladas, crear una reserva ("Vault") de elementos reutilizables y ejecutar sesiones de juego flexibles.

**Objetivo Técnico Principal:** Crear una arquitectura de datos basada en sistema de archivos (JSON/Markdown) en lugar de bases de datos relacionales monolíticas (SQL), para permitir una futura integración sencilla con agentes de IA (RAG/Embeddings) que puedan leer el contexto de la campaña archivo por archivo.

## 2. Stack Tecnológico Requerido

### Backend

- **Lenguaje:** Python 3.10+.
    
- **Framework:** Flask (API RESTful).
    
- **Almacenamiento:** Sistema de archivos local (File System Database). No usar SQLite.
    
- **Serialización:** JSON nativo con codificación UTF-8.
    

### Frontend

- **Framework:** Vue.js 3 (Composition API) o React (Vite). Debe ser una SPA (Single Page Application).
    
- **Estilos:** Tailwind CSS.
    
- **Iconografía:** FontAwesome 6.
    
- **Estado:** Gestión de estado robusta (Pinia para Vue o Context/Redux para React).
    

## 3. Arquitectura de Datos (File System DB)

La estructura de carpetas es crítica para la escalabilidad y la futura lectura por IA.

### Estructura de Directorios

```
/data_storage
    /campaign_{uuid}
        metadata.json       # Datos generales, verdades, frentes
        /vault              # Reserva de elementos
            npc_{uuid}.json
            scene_{uuid}.json
            secret_{uuid}.json
            ...
        /sessions           # Historial de sesiones
            session_01_{uuid}.json
            session_02_{uuid}.json
```

### Esquemas de Datos (JSON Schemas)

#### A. Campaña (`metadata.json`)

- `id`: UUID.
    
- `title`: String.
    
- `elevator_pitch`: String (El gancho principal).
    
- `truths`: Array[String] (Las 6 Verdades del mundo).
    
- `fronts`: Array[Object] (Amenazas activas).
    
    - `name`: String.
        
    - `goal`: String.
        
    - `grim_portents`: Array[String] (3 eventos progresivos).
        
- `safety_tools`: String (Notas sobre líneas rojas/seguridad).
    

#### B. Elemento del Vault (`{type}_{uuid}.json`)

Este es el átomo de la aplicación.

- `id`: UUID.
    
- `type`: Enum ["scene", "secret", "npc", "location", "monster", "item"].
    
- `status`: Enum ["reserve", "active", "archived"].
    
    - _reserve_: En el Vault, disponible para usar.
        
    - _active_: Vinculado a la sesión actual.
        
    - _archived_: Ya jugado/revelado.
        
- `tags`: Array[String] (Para filtrado futuro por IA).
    
- `content`: Object (Varía según el tipo).
    
    - Para **NPC**: `{ name, archetype, description, relationship }`.
        
    - Para **Scene**: `{ title, type (combat/social/explore), description }`.
        
    - Para **Secret**: `{ description }` (Debe ser abstracto).
        
    - Para **Location**: `{ name, aspects[3], description }`.
        

#### C. Sesión (`session_{n}_{uuid}.json`)

- `id`: UUID.
    
- `number`: Integer (Secuencial).
    
- `date`: ISO Date.
    
- `strong_start`: String (Texto del inicio fuerte).
    
- `recap`: String (Resumen de lo que recuerdan los jugadores).
    
- **`notes`**: String (Markdown/Blob). **CRÍTICO:** Campo de texto libre para que el DM escriba notas caóticas en tiempo real durante la partida.
    
- `linked_items`: Array[UUID] (Referencias a los IDs de los archivos en `/vault`).
    
- `status`: Enum ["planned", "completed"].
    

## 4. Requerimientos Funcionales

### Módulo 1: Gestión de Campañas

- **R1.1:** El sistema debe permitir crear N campañas.
    
- **R1.2:** Los datos de una campaña deben estar estrictamente aislados en su carpeta. No se pueden cruzar datos entre campañas.
    
- **R1.3:** Dashboard de Campaña: Debe mostrar siempre el "Elevator Pitch", las "6 Verdades" y los "Frentes" activos para mantener el foco del DM.
    

### Módulo 2: El Vault (Gestión de Recursos)

- **R2.1:** CRUD completo de elementos (Escenas, Secretos, PNJs, etc.).
    
- **R2.2:** Los elementos se crean por defecto en estado "reserve".
    
- **R2.3:** Capacidad de filtrado por tipo de elemento.
    

### Módulo 3: Gestión de Sesión (El "Playlist")

- **R3.1:** Crear nueva sesión (calcula automáticamente el número secuencial).
    
- **R3.2:** **Vinculación (Linking):** El usuario debe poder ver una lista de elementos del Vault en estado "reserve" y seleccionarlos para la sesión actual.
    
    - Al vincular, el estado del archivo JSON del elemento cambia a "active".
        
- **R3.3:** **Desvinculación:** Si el usuario quita un elemento de la sesión, el estado del archivo JSON vuelve a "reserve".
    
- **R3.4:** **Ejecución de Sesión:** Vista dedicada para el momento del juego.
    
    - Panel izquierdo: Lista de escenas, secretos y PNJs seleccionados.
        
    - Panel derecho: Editor de texto grande para las "Notas de Sesión" (Log).
        
- **R3.5:** **Conclusión de Sesión (Lazy Cleanup):**
    
    - Botón para finalizar sesión.
        
    - Acción: Los elementos marcados como "usados/revelados" pasan a estado "archived".
        
    - Acción: Los elementos NO usados se desvinculan automáticamente y vuelven a "reserve" en el Vault para ser reutilizados.
        

## 5. Requerimientos No Funcionales y UX

- **Persistencia:** Guardado automático (Debounce) en los archivos JSON al escribir en los campos de texto (especialmente en Notas de Sesión).
    
- **Interfaz:** Modo oscuro obligatorio (para no cansar la vista durante sesiones nocturnas).
    
- **Rendimiento:** La carga de listas (Vault) debe ser paginada o virtualizada si supera los 100 elementos, aunque al ser archivos locales la latencia será mínima.
    

## 6. Consideraciones para Futura Integración IA (V2)

_No implementar la IA ahora, pero preparar el terreno:_

1. **Atomicidad:** Mantener cada PNJ y Escena en un archivo JSON separado permite que en el futuro una IA vectorice (Embeddings) cada archivo individualmente para búsquedas semánticas precisas.
    
2. **Contexto:** El campo `notes` de las sesiones será la fuente de verdad principal para que la IA genere resúmenes automáticos en el futuro.
    
3. **Tags:** Incluir el campo `tags` en los esquemas JSON aunque no se use mucho en la UI v1, para que la IA pueda auto-clasificar contenido en la v2.
    