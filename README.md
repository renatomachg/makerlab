# Makerlab 1.0 - CRM para Maker Home

**Estado:** Fase 1A ✅ Completada | Fase 1B ⏳ Próxima

---

## 📊 ROADMAP COMPLETO (6 Semanas)

### **FASES:**
---

## 💰 DINERO POR FASE

| Fase | Dinero | Descripción |
|------|--------|-------------|
| 1A | - | Preparación (BD) |
| 1B | ✅ ALTO | Cotizador guarda → persiste |
| 1C | ✅ MEDIO | Maya/Activity → confianza |
| 2A-2B | ✅ ALTO | Pipeline visual → flujo |
| 2C | ✅ MEDIO | Lead Scoring → priorización |
| 3A | ✅ ALTO | Auto-cota → recuperar olvidadas |
| 3B | ✅ ALTO | Follow-ups → recordar pagos |

**TOTAL ROI:** 5-10 cotizaciones × $2-3K = **$10K-30K** en 6 semanas

---

## 🖥️ TRABAJAR EN MÚLTIPLES MACS

### **REGLA DE ORO:**

```bash
**Siempre pull al empezar, push al terminar.**

---

## ✅ CHECKLIST MAESTRA

### **FASE 1A: ✅ COMPLETADA**
- [x] BD: 7 tablas creadas
- [x] Índices + Foreign Keys
- [x] index.html (6.0K)
- [x] css/core.css (6.1K)
- [x] js/core/db.js (7.9K CRUD)
- [x] js/core/auth.js (4.8K login)
- [x] GitHub commit 0530c47

### **FASE 1B: ⏳ PRÓXIMA (Lunes 9 AM)**
- [ ] js/modules/crm/crm.js (listar contactos)
- [ ] js/modules/cotizador/cotizador.js (guardar a BD)
- [ ] js/modules/pipeline/pipeline.js (mostrar órdenes)
- [ ] Refactor index.html → integrar módulos dinámicos
- [ ] Refactor auth.js → conectar a UI
- [ ] Login real con Supabase Auth
- [ ] Testing: crear cotización → aparece en Pipeline

### **FASE 1C: ⏳ (Miércoles)**
- [ ] Maya conectado a Supabase
- [ ] js/modules/crm/activity-feed.js
- [ ] Auto-detectar datos en chat
- [ ] Auto-crear cotización borrador

### **FASE 1D-1E: (Opcional)**
- [ ] Lead scoring (0-100)
- [ ] Dashboards básicos

---

## 🎯 INSTRUCCIONES DIARIAS

### **LUNES 9 AM - Sesión Tipo:**

```bash
# 1. Actualizar desde GitHub
cd ~/projects/makerlab
git pull origin main

# 2. Ver estado
git log --oneline -3
git status

# 3. Crear rama para feature (opcional)
git checkout -b feature/fase-1b-crm

# 4. Desarrollar con Claude Code + Terminal
# (45 min concepto + 45 min coding)

# 5. Al terminar:
git add .
git commit -m "Feat: fase 1B paso X - descripción"
git push origin [rama]

# 6. En GitHub: crear Pull Request (opcional)
#    O directo a main si es pequeño:
git checkout main
git merge feature/fase-1b-crm
git push origin main
```

---

## 🔧 STACK TÉCNICO

- **Frontend:** HTML5, CSS3 (variables CSS), Vanilla JS (ES6 modules)
- **Backend:** Node.js, Express (VPS 76.13.111.112)
- **DB:** Supabase (PostgreSQL) - proyecto `lefbyxdqvurhgbspwhbc`
- **Bot:** Maya (whatsapp-web.js) - en VPS
- **Deploy:** GitHub (renatomachg/makerlab) + cPanel (frontend) + VPS (backend)
- **AI:** Claude Sonnet (respuestas) + Claude API (precios)

---

## 📁 ESTRUCTURA
---

## 🚀 PRÓXIMO PASO

**Lunes 9 AM: FASE 1B**

1. Crear CRM module (listar contactos)
2. Crear Cotizador module (guardar a BD)
3. Crear Pipeline module (mostrar órdenes)
4. Login real con Supabase Auth

**Duración:** 2 días (Lunes-Martes)

---

## 📞 CONTACTO / NOTAS

- **Proyecto:** Makerlab 1.0 CRM
- **Desarrollador:** Renato Machado
- **Empresa:** Maker Home (mhome.mx)
- **GitHub:** https://github.com/renatomachg/makerlab
- **Supabase:** lefbyxdqvurhgbspwhbc
- **VPS:** 76.13.111.112
- **Status:** Activo en desarrollo

---

**Última actualización:** 27 Abril 2026, 20:47 UTC

Last session: Phase 1A completada (BD + archivos core)
Next session: Phase 1B (conectar frontend a Supabase)
