// Variables globales
let map;
let markersLayer;
let allSites = [];
let filteredSites = [];
let supabase;
let currentBaseLayer;
const baseLayers = {};

// Configuración de Supabase
const SUPABASE_URL = 'https://zspvrqkscbpnnwkwgbat.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcHZycWtzY2Jwbm53a3dnYmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTE0MzQsImV4cCI6MjA3OTU4NzQzNH0.t2zBdVtdiF_aMs2JU6nOWMdGUuRZTeQmhHCVqu_L6gI';

// ============================================
// MANEJO DE MENÚS MÓVILES
// ============================================
function initMobileMenus() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileListToggle = document.getElementById('mobileListToggle');
    const filterSidebar = document.getElementById('filterSidebar');
    const statsSidebar = document.getElementById('statsSidebar');
    const overlay = document.getElementById('overlay');
    const closeSidebarBtns = document.querySelectorAll('.close-sidebar');

    // Toggle menú de filtros
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            filterSidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            statsSidebar.classList.remove('active');
        });
    }

    // Toggle lista de sitios
    if (mobileListToggle) {
        mobileListToggle.addEventListener('click', () => {
            statsSidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            filterSidebar.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    }

    // Cerrar sidebars
    closeSidebarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterSidebar.classList.remove('active');
            statsSidebar.classList.remove('active');
            overlay.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    });

    // Cerrar al hacer click en overlay
    if (overlay) {
        overlay.addEventListener('click', () => {
            filterSidebar.classList.remove('active');
            statsSidebar.classList.remove('active');
            overlay.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    }

    // Cerrar menús al redimensionar a desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1200) {
            filterSidebar.classList.remove('active');
            statsSidebar.classList.remove('active');
            overlay.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    });
}

// ============================================
// INICIALIZAR MAPA
// ============================================
function initMap() {
    // Configurar centro y zoom inicial según tamaño de pantalla
    let initialZoom = 11;
    if (window.innerWidth < 768) {
        initialZoom = 10;
    } else if (window.innerWidth < 1200) {
        initialZoom = 10.5;
    }

    map = L.map('map').setView([3.8801, -77.0314], initialZoom);
    
    // Definir las capas base
    baseLayers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    });

    baseLayers.esritopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 19
    });

    baseLayers.satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '© Google',
        maxZoom: 20
    });
    
    // Agregar la capa base por defecto (OpenStreetMap)
    currentBaseLayer = baseLayers.osm;
    currentBaseLayer.addTo(map);
    
    markersLayer = L.layerGroup().addTo(map);

    // Ajustar mapa al redimensionar ventana
    window.addEventListener('resize', debounce(() => {
        map.invalidateSize();
    }, 250));
}

// Función debounce para optimizar eventos de resize
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// CAMBIAR MAPA BASE
// ============================================
function cambiarMapaBase() {
    const selector = document.getElementById('basemapSelector');
    const selectedBase = selector.value;

    // Remover la capa actual
    if (currentBaseLayer) {
        map.removeLayer(currentBaseLayer);
    }

    // Agregar la nueva capa
    currentBaseLayer = baseLayers[selectedBase];
    currentBaseLayer.addTo(map);
}

// ============================================
// CONECTAR A SUPABASE Y CARGAR DATOS
// ============================================
async function conectarSupabase() {
    const loadingEl = document.getElementById('loadingMessage');
    const errorEl = document.getElementById('errorMessage');
    const mainContentEl = document.getElementById('mainContent');

    try {
        loadingEl.querySelector('div:last-child').textContent = 'Conectando con Supabase...';

        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        loadingEl.querySelector('div:last-child').textContent = 'Cargando datos de sitios turísticos...';

        const { data, error } = await supabase
            .from('sitios')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error('No se encontraron datos en la tabla');
        }

        allSites = data;
        filteredSites = [...allSites];

        loadingEl.classList.add('hide');
        mainContentEl.classList.add('show');

        initMap();
        initMobileMenus();
        inicializarFiltros();
        aplicarFiltros();

    } catch (error) {
        console.error('Error completo:', error);
        loadingEl.classList.add('hide');
        errorEl.textContent = `Error al cargar los datos:\n${error.message}\n\nVerifica:\n1. La URL de Supabase\n2. La API Key\n3. El nombre de la tabla\n4. Los permisos de acceso`;
        errorEl.classList.add('show');
    }
}

// ============================================
// ACTUALIZAR ESTADÍSTICAS
// ============================================
function actualizarEstadisticas(sites) {
    const count = sites.length;
    
    // Actualizar contador desktop
    const sitiosVisiblesEl = document.getElementById('sitiosVisibles');
    if (sitiosVisiblesEl) {
        sitiosVisiblesEl.textContent = count;
    }
    
    // Actualizar contador móvil
    const sitiosVisiblesMobileEl = document.getElementById('sitiosVisiblesMobile');
    if (sitiosVisiblesMobileEl) {
        sitiosVisiblesMobileEl.textContent = count;
    }
    
    // Actualizar badge del botón móvil
    const siteCountBadge = document.querySelector('.site-count');
    if (siteCountBadge) {
        siteCountBadge.textContent = count;
    }
}

// ============================================
// INICIALIZAR FILTROS
// ============================================
function inicializarFiltros() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', aplicarFiltros);
    });

    const filterGroups = document.querySelectorAll('.filter-group h3');
    filterGroups.forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('collapsed');
        });
    });
}

// ============================================
// LIMPIAR FILTROS
// ============================================
function limpiarFiltros() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.id === 'filterMaritimo' || checkbox.id === 'filterTerrestre') {
            checkbox.checked = true;
        } else {
            checkbox.checked = false;
        }
    });
    aplicarFiltros();
}

// ============================================
// APLICAR FILTROS
// ============================================
function aplicarFiltros() {
    const filtros = {
        // Acceso
        maritimo: document.getElementById('filterMaritimo').checked,
        terrestre: document.getElementById('filterTerrestre').checked,
        
        // Tipos de Turismo
        cultural: document.getElementById('filterCultural').checked,
        natural: document.getElementById('filterNatural').checked,
        gastronomico: document.getElementById('filterGastronomico').checked,
        rio: document.getElementById('filterRio').checked,
        playa: document.getElementById('filterPlaya').checked,
        tourHarbor: document.getElementById('filterTourHarbor').checked,
        
        // Servicios
        alojamiento: document.getElementById('filterAlojamiento').checked,
        internet: document.getElementById('filterInternet').checked,
        
        // Actividades
        tubing: document.getElementById('filterTubing').checked,
        canotaje: document.getElementById('filterCanotaje').checked,
        snorkel: document.getElementById('filterSnorkel').checked,
        buceo: document.getElementById('filterBuceo').checked,
        
        // Otros Atractivos
        ballenas: document.getElementById('filterBallenas').checked,
        cascadas: document.getElementById('filterCascadas').checked,
        catamaran: document.getElementById('filterCatamaran').checked
    };

    filteredSites = allSites.filter(site => {
        // Filtro por acceso (al menos uno debe estar activo)
        const accesoValido = (filtros.maritimo && site.acceso === 'maritimo') ||
                            (filtros.terrestre && site.acceso === 'terrestre');
        if (!accesoValido) return false;

        // Filtros de Tipos de Turismo
        if (filtros.cultural && site['Turismo Cultural'] !== 'Si') return false;
        if (filtros.natural && site['Turismo Natural'] !== 'Si') return false;
        if (filtros.gastronomico && site['Turismo Gastronomico'] !== 'Si') return false;
        if (filtros.rio && site['Turismo Rio'] !== 'Si') return false;
        if (filtros.playa && site['Turismo Playa'] !== 'Si') return false;
        if (filtros.tourHarbor && site['Tour Harbor'] !== 'Si') return false;

        // Filtros de Servicios
        if (filtros.alojamiento && site.Alojamiento !== 'Si') return false;
        if (filtros.internet && site['Cn. Internet'] !== 'Si') return false;

        // Filtros de Actividades
        if (filtros.tubing && site['Tubing / Flotador'] !== 'Si') return false;
        if (filtros.canotaje && site.Canotaje !== 'Si') return false;
        if (filtros.snorkel && site['Snorkel / Caterear'] !== 'Si') return false;
        if (filtros.buceo && site.Buceo !== 'Si') return false;

        // Filtros de Otros Atractivos
        if (filtros.ballenas && site['Avista Ballenas'] !== 'Si') return false;
        if (filtros.cascadas && site.Cascada !== 'Si') return false;
        if (filtros.catamaran && site.Catamaran !== 'Si') return false;

        return true;
    });

    mostrarSitiosMapa(filteredSites);
    actualizarListaSitios(filteredSites);
    actualizarEstadisticas(filteredSites);

    // En móvil, cerrar el sidebar de filtros después de aplicar
    if (window.innerWidth <= 1200) {
        const filterSidebar = document.getElementById('filterSidebar');
        const overlay = document.getElementById('overlay');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        
        if (filterSidebar && filterSidebar.classList.contains('active')) {
            setTimeout(() => {
                filterSidebar.classList.remove('active');
                overlay.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }, 300);
        }
    }
}

// ============================================
// ACTUALIZAR LISTA DE SITIOS
// ============================================
function actualizarListaSitios(sites) {
    const listContainer = document.getElementById('sitesList');
    listContainer.innerHTML = '';

    if (sites.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #90A4AE; padding: 20px; font-size: 14px;">No hay sitios que coincidan con los filtros</p>';
        return;
    }

    sites.forEach(site => {
        const item = document.createElement('div');
        item.className = 'site-item';
        item.onclick = () => {
            centrarEnSitio(site.nombre);
            // En móvil, cerrar el sidebar después de seleccionar
            if (window.innerWidth <= 1200) {
                const statsSidebar = document.getElementById('statsSidebar');
                const overlay = document.getElementById('overlay');
                setTimeout(() => {
                    statsSidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }, 300);
            }
        };
        
        item.innerHTML = `
            <div class="site-name">${site.nombre || 'Sin nombre'}</div>
            <div class="site-meta">
                ${site.acceso ? `🚤 ${site.acceso}` : ''} 
                ${site['camas disp'] ? `| 🛏️ ${site['camas disp']} camas` : ''}
            </div>
        `;
        
        listContainer.appendChild(item);
    });
}

// ============================================
// MOSTRAR SITIOS EN EL MAPA
// ============================================
function mostrarSitiosMapa(sites) {
    markersLayer.clearLayers();

    const bounds = [];
    let validSites = 0;

    sites.forEach(site => {
        const geom = site.geom || site.geo;
        const coords = extraerCoordenadas(geom);
        
        if (!coords) return;

        validSites++;
        
        // Crear marcador personalizado
        const marker = L.marker([coords.lat, coords.lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: '<div style="background: #4A90E2; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        });
        
        const popupContent = crearPopupContent(site);
        marker.bindPopup(popupContent, {
            maxWidth: window.innerWidth < 768 ? 250 : 300,
            className: 'custom-popup'
        });
        
        marker.addTo(markersLayer);
        bounds.push([coords.lat, coords.lng]);
    });

    if (bounds.length > 0) {
        // Ajustar padding según tamaño de pantalla
        let padding = [50, 50];
        if (window.innerWidth < 768) {
            padding = [30, 30];
        }
        map.fitBounds(bounds, { padding: padding, maxZoom: 14 });
    }
}

// ============================================
// EXTRAER COORDENADAS
// ============================================
function extraerCoordenadas(geom) {
    if (!geom) return null;

    try {
        if (typeof geom === 'string') {
            // Formato hexadecimal EWKB (PostGIS)
            if (geom.startsWith('0101000020')) {
                const hex = geom.substring(18);
                
                function hexToDouble(hexStr) {
                    const bytes = [];
                    for (let i = 0; i < 16; i += 2) {
                        bytes.push(parseInt(hexStr.substr(i, 2), 16));
                    }
                    const buffer = new ArrayBuffer(8);
                    const view = new DataView(buffer);
                    for (let i = 0; i < 8; i++) {
                        view.setUint8(i, bytes[i]);
                    }
                    return view.getFloat64(0, true);
                }
                
                const lng = hexToDouble(hex.substring(0, 16));
                const lat = hexToDouble(hex.substring(16, 32));
                
                return { lng, lat };
            }
            
            // Formato WKT
            const match = geom.match(/POINT\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)/i);
            if (match) {
                return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
            }
        } else if (geom.type === 'Point' && geom.coordinates) {
            // Formato GeoJSON
            return { lng: geom.coordinates[0], lat: geom.coordinates[1] };
        }
    } catch (e) {
        console.error('Error extrayendo coordenadas:', e, geom);
    }

    return null;
}

// ============================================
// CREAR CONTENIDO DEL POPUP
// ============================================
function crearPopupContent(site) {
    const nombre = site.nombre || 'Sin nombre';
    const acceso = site.acceso || 'No especificado';
    const camas = site['camas disp'] || 0;

    const servicios = [];
    const actividades = [];
    const turismo = [];
    const otrosAtractivos = [];
    
    // Servicios
    if (site.Alojamiento === 'Si') servicios.push('🏠 Alojamiento');
    if (site['Cn. Internet'] === 'Si') servicios.push('📶 Internet');

    // Actividades
    if (site['Tubing / Flotador'] === 'Si') actividades.push('🆘 Tubing/Flotador');
    if (site.Canotaje === 'Si') actividades.push('🚣 Canotaje/Kayak');
    if (site['Snorkel / Caterear'] === 'Si') actividades.push('🤿 Snorkel');
    if (site.Buceo === 'Si') actividades.push('🤿 Buceo');

    // Tipos de Turismo
    if (site['Turismo Cultural'] === 'Si') turismo.push('🎭 Cultural');
    if (site['Turismo Natural'] === 'Si') turismo.push('🌿 Natural');
    if (site['Turismo Gastronomico'] === 'Si') turismo.push('🍴 Gastronómico');
    if (site['Turismo Rio'] === 'Si') turismo.push('🚣 Río');
    if (site['Turismo Playa'] === 'Si') turismo.push('🏖️ Playa');
    if (site['Tour Harbor'] === 'Si') turismo.push('⚓ Tour Harbor');
    
    // Otros Atractivos
    if (site['Avista Ballenas'] === 'Si') otrosAtractivos.push('🐋 Ballenas');
    if (site.Cascada === 'Si') otrosAtractivos.push('💧 Cascada');
    if (site.Catamaran === 'Si') otrosAtractivos.push('⛵ Catamarán');

    let content = `
        <div class="popup-title">${nombre}</div>
        <div class="popup-info"><strong>Acceso:</strong> ${acceso}</div>
        <div class="popup-info"><strong>Camas:</strong> ${camas}</div>
    `;

    if (servicios.length > 0) {
        content += `<div class="popup-info"><strong>Servicios:</strong><br>${servicios.join('<br>')}</div>`;
    }

    if (actividades.length > 0) {
        content += `<div class="popup-info"><strong>Actividades:</strong><br>${actividades.join('<br>')}</div>`;
    }

    if (turismo.length > 0) {
        content += `<div class="popup-info"><strong>Turismo:</strong><br>${turismo.join('<br>')}</div>`;
    }
    
    if (otrosAtractivos.length > 0) {
        content += `<div class="popup-info"><strong>Otros Atractivos:</strong><br>${otrosAtractivos.join('<br>')}</div>`;
    }

    return content;
}

// ============================================
// CENTRAR EN SITIO
// ============================================
function centrarEnSitio(nombre) {
    const site = allSites.find(s => s.nombre === nombre);
    if (!site) return;

    const geom = site.geom || site.geo;
    if (!geom) return;

    const coords = extraerCoordenadas(geom);
    if (!coords) return;

    // Ajustar zoom según tamaño de pantalla
    let zoomLevel = 15;
    if (window.innerWidth < 768) {
        zoomLevel = 14;
    }

    map.setView([coords.lat, coords.lng], zoomLevel);
    
    markersLayer.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            const layerLatLng = layer.getLatLng();
            if (Math.abs(layerLatLng.lat - coords.lat) < 0.0001 && 
                Math.abs(layerLatLng.lng - coords.lng) < 0.0001) {
                layer.openPopup();
            }
        }
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    conectarSupabase();
});

// Manejar orientación en móviles
window.addEventListener('orientationchange', debounce(() => {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}, 100));
