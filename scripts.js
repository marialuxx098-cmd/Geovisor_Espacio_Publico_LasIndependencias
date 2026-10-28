/* ============ MAPA Y MAPAS BASE ============ */
var map = L.map('map', { zoomControl: false }).setView([6.24, -75.58], 13);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

var Stadia_AlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
  minZoom: 0, maxZoom: 20, ext: 'jpg',
  attribution: '&copy; CNES, Airbus DS, PlanetObserver | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});
var Esri_WorldStreetMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
});

var basemaps = [
  { name: 'Calles', layer: Esri_WorldStreetMap },
  { name: 'Imágenes', layer: Esri_WorldImagery },
  { name: 'Satélite', layer: Stadia_AlidadeSatellite }
];
var currentBase = null;
function setBase(i) {
  if (currentBase) map.removeLayer(currentBase);
  currentBase = basemaps[i].layer.addTo(map);
  currentBase.bringToBack();
  document.querySelectorAll('#basemaps button').forEach(function (b, k) { b.classList.toggle('active', k === i); });
}
basemaps.forEach(function (b, i) {
  var btn = document.createElement('button');
  btn.textContent = b.name;
  btn.onclick = function () { setBase(i); };
  document.getElementById('basemaps').appendChild(btn);
});
setBase(0);

/* ============ PANEL DE CAPAS ============ */
var overlays = [];
var ICON_ZOOM = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2M11 8v6M8 11h6"/></svg>';

function registrar(id, nombre, layer, color, getBounds) {
  var e = { id: id, nombre: nombre, layer: layer, color: color, on: map.hasLayer(layer), getBounds: getBounds, disponible: true, nota: '' };
  overlays.push(e);
  return e;
}

function renderCapas() {
  var ul = document.getElementById('layerList');
  ul.innerHTML = '';
  overlays.forEach(function (e) {
    var li = document.createElement('li');
    li.className = (e.on ? '' : 'off ') + (e.disponible ? '' : 'na');
    li.innerHTML =
      '<span class="sw-color" style="background:' + e.color + '"></span>' +
      '<span class="lname">' + e.nombre + (e.nota ? '<small>' + e.nota + '</small>' : '') + '</span>' +
      '<button class="zoom" title="Ir a la capa">' + ICON_ZOOM + '</button>' +
      '<button class="switch" role="switch" aria-checked="' + e.on + '" ' + (e.disponible ? '' : 'disabled') + ' title="Activar / desactivar"></button>';
    li.querySelector('.switch').onclick = function () {
      e.on = !e.on;
      if (e.on) {
        map.addLayer(e.layer);
        var bounds = e.getBounds ? e.getBounds() : (e.layer.getBounds && e.layer.getBounds());
        if (bounds && bounds.isValid && bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
      } else {
        map.removeLayer(e.layer);
      }
      renderCapas();
    };
    li.querySelector('.zoom').onclick = function () {
      var b = e.getBounds ? e.getBounds() : (e.layer.getBounds && e.layer.getBounds());
      if (b && b.isValid && b.isValid()) map.fitBounds(b, { padding: [60, 60], maxZoom: 18 });
    };
    ul.appendChild(li);
  });
  document.getElementById('count').textContent =
    overlays.filter(function (e) { return e.on; }).length + ' de ' + overlays.length + ' activas';
}
document.getElementById('panelToggle').onclick = function () {
  document.getElementById('panel').classList.toggle('collapsed');
};

/* ============ SHAPEFILES (.zip) ============ */
function mostrarAtributos(feature, layer) {
  const contenido = document.createElement('div');
  contenido.className = 'popup-atributos';

  const tabla = document.createElement('table');
  const propiedades = feature && feature.properties ? feature.properties : {};
  Object.entries(propiedades).forEach(function ([campo, valor]) {
    const fila = document.createElement('tr');
    const encabezado = document.createElement('th');
    const celda = document.createElement('td');

    encabezado.textContent = campo;
    celda.textContent = valor === null || valor === undefined || valor === ''
      ? '—'
      : (typeof valor === 'object' ? JSON.stringify(valor) : String(valor));
    fila.append(encabezado, celda);
    tabla.appendChild(fila);
  });

  if (!tabla.rows.length) {
    const vacio = document.createElement('p');
    vacio.textContent = 'Esta entidad no tiene atributos.';
    contenido.appendChild(vacio);
  } else {
    contenido.appendChild(tabla);
  }

  layer.bindPopup(contenido, { maxWidth: 380, maxHeight: 300 });
}

var capasShape = [
  { id: 'limite-barrios', archivo: 'LIMITE_BARRIO.zip', nombre: 'Limite de barrios', color: '#3b6ea5' },
  { id: 'equipamientos', archivo: 'EQUIPAMIENTOS.zip', nombre: 'Equipamientos 2024', color: '#b08d57' },
  { id: 'espacio-publico-2006', archivo: 'ESPACIO_PUBLICO_2006.zip', nombre: 'Espacio publico 2006', color: '#a05a5a' },
  { id: 'espacio-publico-2014', archivo: 'ESPACIO_PUBLICO_2014.zip', nombre: 'Espacio publico 2014', color: '#5e8b7e' },
  { id: 'espacio-publico-2024', archivo: 'ESPACIO_PUBLICO_2024.zip', nombre: 'Espacio publico 2024', color: '#8064a2' },
  { id: 'buffer-2006', archivo: 'BUFFER_2006.zip', nombre: 'Buffer espacio publico 2006', color: '#d46a6a' },
  { id: 'buffer-2014', archivo: 'BUFFER_2014.zip', nombre: 'Buffer espacio publico 2014', color: '#42a58a' },
  { id: 'buffer-2024', archivo: 'BUFFER_2024.zip', nombre: 'Buffer espacio publico 2024', color: '#ed9b35' }
];

capasShape.forEach(function (config) {
  var layer = L.geoJSON(null, {
    style: function () { return { color: config.color, weight: 2, fillColor: config.color, fillOpacity: 0.25 }; },
    pointToLayer: function (feature, latlng) { return L.circleMarker(latlng, { radius: 5, color: config.color, fillColor: config.color, fillOpacity: 0.8 }); },
    onEachFeature: mostrarAtributos
  });
  var entrada = registrar(config.id, config.nombre, layer, config.color);
  entrada.nota = 'Cargando...';
  var url = new URL('./data/' + config.archivo, document.baseURI);
  fetch(url.href)
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status + ' al leer ' + url.pathname);
      return response.arrayBuffer();
    })
    .then(function (buffer) { return shp(buffer); })
    .then(function (resultados) {
      var colecciones = Array.isArray(resultados) ? resultados
        : (resultados && resultados.type === 'FeatureCollection' ? [resultados]
          : Object.keys(resultados || {}).map(function (key) { return resultados[key]; }));
      colecciones = colecciones.filter(function (fc) { return fc && fc.type === 'FeatureCollection'; });
      if (!colecciones.length) throw new Error('El ZIP no contiene entidades Shapefile válidas');
      var totalEntidades = colecciones.reduce(function (total, fc) {
        return total + (Array.isArray(fc.features) ? fc.features.length : 0);
      }, 0);
      if (!totalEntidades) throw new Error('El Shapefile no contiene entidades');
      colecciones.forEach(function (fc) { layer.addData(fc); });
      entrada.nota = '';
      renderCapas();
    })
    .catch(function (err) {
      console.error('No se pudo cargar ' + config.archivo + ':', err);
      entrada.nota = 'Error: ' + (err && err.message ? err.message : String(err));
      entrada.disponible = false;
      entrada.on = false; map.removeLayer(layer);
      renderCapas();
    });
});

/* ============ HERRAMIENTAS DE DIBUJO Y MEDICIÓN ============ */
var dibujos = L.featureGroup();
registrar('dibujos', 'Mis dibujos', dibujos, '#3b6ea5', function () { return dibujos.getBounds(); });
renderCapas();

var ESTILO = { color: '#3b6ea5', weight: 3, fillColor: '#3b6ea5', fillOpacity: 0.2 };
var ESTILO_MED = { color: '#b08d57', weight: 3, dashArray: '8 6', fillColor: '#b08d57', fillOpacity: 0.18 };
var HINTS = {
  point: 'Haz clic para colocar puntos',
  line: 'Clic para añadir vértices · doble clic para terminar',
  polygon: 'Clic para añadir vértices · doble clic para cerrar',
  dist: 'Clic para medir · doble clic para terminar',
  area: 'Clic para delimitar · doble clic para calcular el área'
};
var tool = null, pts = [], prev = null, vertices = null, tip = null, mouse = null;

function fmtLong(m) { return m < 1000 ? m.toFixed(1) + ' m' : (m / 1000).toFixed(2) + ' km'; }
function fmtArea(a) { return (a < 1e6 ? a.toFixed(0) + ' m²' : (a / 1e6).toFixed(2) + ' km²') + ' · ' + (a / 1e4).toFixed(2) + ' ha'; }
function largo(p) { var s = 0; for (var i = 1; i < p.length; i++) s += p[i - 1].distanceTo(p[i]); return s; }
function area(p) {
  var r = Math.PI / 180, s = 0, n = p.length;
  if (n < 3) return 0;
  for (var i = 0; i < n; i++) { var a = p[i], b = p[(i + 1) % n]; s += (b.lng - a.lng) * r * (2 + Math.sin(a.lat * r) + Math.sin(b.lat * r)); }
  return Math.abs(s * 6378137 * 6378137 / 2);
}
function perim(p) { return largo(p.concat([p[0]])); }

function textoVivo(p) {
  if (tool === 'line' || tool === 'dist') return fmtLong(largo(p));
  if (tool === 'polygon' || tool === 'area') return p.length > 2 ? fmtArea(area(p)) : fmtLong(largo(p));
  return '';
}
function esPoligono() { return tool === 'polygon' || tool === 'area'; }
function esMedida() { return tool === 'dist' || tool === 'area'; }

function iniciar(t) {
  var igual = tool === t;
  cancelar();
  if (igual) return;
  tool = t;
  if (!dibujos._map) { map.addLayer(dibujos); overlays.forEach(function (e) { if (e.id === 'dibujos') e.on = true; }); renderCapas(); }
  vertices = L.layerGroup().addTo(map);
  map.getContainer().style.cursor = 'crosshair';
  map.doubleClickZoom.disable();
  document.querySelectorAll('[data-tool]').forEach(function (b) { b.classList.toggle('active', b.dataset.tool === t); });
  document.getElementById('hintText').textContent = HINTS[t] + ' · Esc para cancelar';
  document.getElementById('hint').classList.add('show');
}

function limpiarTemporales() {
  [prev, vertices, tip].forEach(function (l) { if (l) map.removeLayer(l); });
  prev = vertices = tip = null; pts = [];
}
function cancelar() {
  limpiarTemporales();
  tool = null;
  map.getContainer().style.cursor = '';
  map.doubleClickZoom.enable();
  document.querySelectorAll('[data-tool]').forEach(function (b) { b.classList.remove('active'); });
  document.getElementById('hint').classList.remove('show');
}

function actualizar(extra) {
  var p = extra ? pts.concat([extra]) : pts;
  if (!prev) prev = (esPoligono() ? L.polygon : L.polyline)(p, esMedida() ? ESTILO_MED : ESTILO).addTo(map);
  else prev.setLatLngs(p);
  if (esMedida() && p.length > 1) {
    if (!tip) tip = L.tooltip({ permanent: true, direction: 'right', offset: [14, 0], className: 'tt' }).addTo(map);
    tip.setLatLng(p[p.length - 1]).setContent(textoVivo(p));
  }
}

function ptoDibujado(ll) {
  var m = L.marker(ll).addTo(dibujos);
  m.bindPopup('<b>Punto</b><br>Lat: ' + ll.lat.toFixed(6) + '<br>Lon: ' + ll.lng.toFixed(6));
}

function finalizar() {
  if (!tool || tool === 'point') { cancelar(); return; }
  var min = esPoligono() ? 3 : 2;
  if (pts.length < min) { cancelar(); return; }
  var p = pts.slice(), medida = esMedida(), poli = esPoligono(), t = tool;
  var capa = (poli ? L.polygon : L.polyline)(p, medida ? ESTILO_MED : ESTILO).addTo(dibujos);
  var info;
  if (t === 'dist') info = '<b>Distancia</b><br>' + fmtLong(largo(p));
  else if (t === 'line') info = '<b>Línea</b><br>Longitud: ' + fmtLong(largo(p));
  else info = '<b>' + (t === 'area' ? 'Área medida' : 'Polígono') + '</b><br>Área: ' + fmtArea(area(p)) + '<br>Perímetro: ' + fmtLong(perim(p));
  capa.bindPopup(info);
  if (medida) capa.bindTooltip(t === 'dist' ? fmtLong(largo(p)) : fmtArea(area(p)), { permanent: true, direction: 'center', className: 'tt' });
  limpiarTemporales();
  vertices = L.layerGroup().addTo(map);
}

map.on('click', function (e) {
  if (!tool) return;
  if (tool === 'point') { ptoDibujado(e.latlng); return; }
  pts.push(e.latlng);
  L.circleMarker(e.latlng, { radius: 4, color: '#fff', weight: 2, fillColor: esMedida() ? '#b08d57' : '#3b6ea5', fillOpacity: 1 }).addTo(vertices);
  actualizar();
});
map.on('dblclick', function () {
  if (!tool || tool === 'point') return;
  pts.pop();            // el doble clic suma un vértice repetido
  finalizar();
});
map.on('mousemove', function (e) {
  document.getElementById('coords').textContent = 'Lat: ' + e.latlng.lat.toFixed(6) + ' | Lon: ' + e.latlng.lng.toFixed(6);
  if (tool && tool !== 'point' && pts.length) actualizar(e.latlng);
});

document.querySelectorAll('[data-tool]').forEach(function (b) { b.onclick = function () { iniciar(b.dataset.tool); }; });
document.getElementById('finishBtn').onclick = finalizar;
document.getElementById('cancelBtn').onclick = cancelar;
document.getElementById('clearBtn').onclick = function () { dibujos.clearLayers(); };
document.addEventListener('keydown', function (e) {
  if (!tool) return;
  if (e.key === 'Escape') cancelar();
  else if (e.key === 'Enter') finalizar();
  else if (e.key === 'Backspace' && pts.length) { pts.pop(); vertices.removeLayer(vertices.getLayers().pop()); pts.length ? actualizar() : (map.removeLayer(prev), prev = null, tip && (map.removeLayer(tip), tip = null)); }
});

/* Menú plegable */
document.getElementById('toolsBtn').onclick = function () {
  var t = document.getElementById('tools');
  t.classList.toggle('open');
  this.setAttribute('aria-expanded', t.classList.contains('open'));
};
