# Guía de instalación y ejecución local de **RolFusion**

Esta guía está pensada para usuarios que trabajen en **Windows** y quieran poner en marcha el proyecto después de clonarlo.

---

## 📋 Prerrequisitos

- **Git** (para clonar el repositorio)
- **Python 3.10 o superior**
- **Node.js** (v18+ recomendado) y **npm**
- Opcional: **Visual Studio Code** u otro editor de código
- Opcional: **API Key de Google Gemini** (solo si quieres usar las funciones de IA)

---

## 🛠️ Paso a paso

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/rolfusion.git
cd rolfusion
```

### 2️⃣ Backend (Python)
```bash
cd backend
# Crear entorno virtual
python -m venv venv
# Activar (cmd)
venv\Scripts\activate
# o PowerShell
# .\venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt
```

#### Configuración del entorno (Opcional)
Si quieres usar las funciones de IA con Google Gemini:
- Crea un archivo `.env` en la carpeta `backend`:
```bash
echo GEMINI_API_KEY=tu_clave_api_aqui > .env
```
- También puedes configurar la API key directamente desde la interfaz de usuario en la sección de **Configuración**.

> **Nota**: La aplicación usa almacenamiento local en archivos JSON (carpeta `data/`), **no requiere PostgreSQL ni ninguna base de datos**.

#### Ejecutar el backend
```bash
python app.py
```
El servidor arrancará en `http://127.0.0.1:5000` (verifica la salida en la consola).

---

### 3️⃣ Frontend (React/Vite)
```bash
cd ..\frontend
npm install
npm run dev
```
Esto iniciará el servidor de desarrollo (por defecto en `http://localhost:5173`).

---

## 🚀 Ver la aplicación
- Abre tu navegador y visita **http://localhost:5173**
- El frontend se comunica automáticamente con el backend en `http://127.0.0.1:5000`
- Para usar las funciones de IA, ve a **Configuración** en la app y añade tu API key de Google Gemini

---

## 🐛 Solución de problemas comunes

### Error al activar el entorno virtual en PowerShell
Ejecuta PowerShell como administrador o cambia la política de ejecución:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Dependencias de npm fallan
Elimina `node_modules` y el archivo `package-lock.json`, luego reinstala:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### El backend no arranca
- Verifica que el entorno virtual esté activado (deberías ver `(venv)` en tu terminal)
- Asegúrate de estar en la carpeta `backend` cuando ejecutas `python app.py`
- Comprueba que el puerto 5000 no esté ocupado por otra aplicación

### El frontend no se conecta al backend
- Verifica que el backend esté corriendo en `http://127.0.0.1:5000`
- Comprueba la consola del navegador (F12) para ver errores de red

---

## 📚 Recursos adicionales
- Documentación de Flask: https://flask.palletsprojects.com/
- Guía de Vite: https://vitejs.dev/guide/
- Google Gemini API: https://ai.google.dev/

---

¡Listo! Ahora deberías poder desarrollar y probar **RolFusion** en tu máquina local.
