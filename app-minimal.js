// Mar y Rios Pacifico - Versión Minimal
console.log('🚀 App iniciada');

// Variables globales
let map;
let markersLayer;
let allSites = [];
let filteredSites = [];
let supabase; // ← SOLO UNA VEZ
let currentBaseLayer;
const baseLayers = {};

// Configuración de Supabase
const SUPABASE_URL = 'https://zspvrqkscbpnnwkwgbat.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcHZycWtzY2Jwbm53a3dnYmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTE0MzQsImV4cCI6MjA3OTU4NzQzNH0.t2zBdVtdiF_aMs2JU6nOWMdGUuRZTeQmhHCVqu_L6gI';

console.log('✅ Variables declaradas correctamente');

// Función para conectar
async function conectarSupabase() {
    console.log('📡 Intentando conectar a Supabase...');
    
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Cliente Supabase creado');
        
        const { data, error } = await supabase.from('sitios').select('*');
        
        if (error) {
            console.error('❌ Error de Supabase:', error);
            alert('Error al cargar datos: ' + error.message);
            return;
        }
        
        console.log('✅ Datos cargados:', data.length, 'sitios');
        alert('✅ ÉXITO! Se cargaron ' + data.length + ' sitios');
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
    }
}

console.log('✅ Funciones definidas');
console.log('🎯 Iniciando en 2 segundos...');

// Iniciar
setTimeout(() => {
    console.log('🚀 Ejecutando...');
    conectarSupabase();
}, 2000);
