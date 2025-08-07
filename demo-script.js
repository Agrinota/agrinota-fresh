// Global variables
let map;
let markers = [];
let stakeMarkers = {}; // Store markers by stake ID for easy access
let currentStake = 'A';
let stakeData = {};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Detect if running in fullscreen (not iframe) and apply responsive styles
    detectAndApplyDisplayMode();
    
    // Also try after a short delay to ensure DOM is fully ready
    setTimeout(detectAndApplyDisplayMode, 100);
    
    initializeStakeData();
    createStakeButtons();
    setupTabSwitching();
    setupModalControls();
    startDataSimulation();
    
    // Initialize AI button status
    const dangerStakes = Object.keys(stakeData).filter(id => stakeData[id].status === 'danger');
    const warningStakes = Object.keys(stakeData).filter(id => stakeData[id].status === 'warning');
    updateFloatingAIButton(dangerStakes.length > 0, warningStakes.length > 0);
    
    // Show AI insights modal after a much longer delay (optional)
    // Users can click the floating button if they want to see it
    // setTimeout(() => {
    //     showModal();
    // }, 30000); // 30 seconds instead of 2
});

// Initialize Google Maps
function initMap() {
    // Calculate center point of all stakes for optimal viewing
    const stakePositions = [
        { id: 'A', lat: 36.7820, lng: -119.4145, status: 'normal' },
        { id: 'B', lat: 36.7765, lng: -119.4125, status: 'normal' },
        { id: 'C', lat: 36.7845, lng: -119.4220, status: 'normal' },
        { id: 'D', lat: 36.7735, lng: -119.4195, status: 'normal' },
        { id: 'I', lat: 36.7815, lng: -119.4235, status: 'normal' },
        { id: 'J', lat: 36.7750, lng: -119.4245, status: 'normal' },
        { id: 'E', lat: 36.7725, lng: -119.4155, status: 'warning' },
        { id: 'F', lat: 36.7800, lng: -119.4179, status: 'danger' },
        { id: 'G', lat: 36.7810, lng: -119.4190, status: 'danger' },
        { id: 'H', lat: 36.7790, lng: -119.4190, status: 'danger' }
    ];
    
    // Calculate the center point of all stakes
    const centerLat = stakePositions.reduce((sum, stake) => sum + stake.lat, 0) / stakePositions.length;
    const centerLng = stakePositions.reduce((sum, stake) => sum + stake.lng, 0) / stakePositions.length;
    const stakesCenter = { lat: centerLat, lng: centerLng };
    
    const mapElement = document.getElementById('map');
    console.log('Map element dimensions:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);
    
    if (!mapElement) {
        console.error('Map element not found!');
        return;
    }
    
    map = new google.maps.Map(mapElement, {
        zoom: 14, // Temporary zoom until fitBounds is called
        center: stakesCenter, // Temporary center
        mapTypeId: 'satellite',
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER
        },
        scaleControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: 'cooperative',
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    // Add stake markers
    addStakeMarkers();
    
    // Add native Google Maps heat map control
    addHeatMapControl();
}

// Add stake markers to the map
function addStakeMarkers() {
    // Mix of scattered normal stakes and organized fire cluster
    const stakePositions = [
        // Scattered normal stakes
        { id: 'A', lat: 36.7820, lng: -119.4145, status: 'normal' },
        { id: 'B', lat: 36.7765, lng: -119.4125, status: 'normal' },
        { id: 'C', lat: 36.7845, lng: -119.4220, status: 'normal' },
        { id: 'D', lat: 36.7735, lng: -119.4195, status: 'normal' },
        { id: 'I', lat: 36.7815, lng: -119.4235, status: 'normal' },
        { id: 'J', lat: 36.7750, lng: -119.4245, status: 'normal' },
        
        // Warning stake
        { id: 'E', lat: 36.7725, lng: -119.4155, status: 'warning' },
        
        // Fire cluster in tight triangle formation
        { id: 'F', lat: 36.7800, lng: -119.4179, status: 'danger' }, // Fire cluster center
        { id: 'G', lat: 36.7810, lng: -119.4190, status: 'danger' }, // Fire cluster northeast
        { id: 'H', lat: 36.7790, lng: -119.4190, status: 'danger' }  // Fire cluster southeast
    ];
    
    // Create bounds for auto-zoom functionality  
    const bounds = new google.maps.LatLngBounds();
    
    console.log('About to create', stakePositions.length, 'markers');

    stakePositions.forEach(stake => {
        // Add wide translucent circle
        const circle = new google.maps.Circle({
            strokeColor: getStatusColor(stake.status),
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: getStatusColor(stake.status),
            fillOpacity: 0.2,
            map: map,
            center: { lat: stake.lat, lng: stake.lng },
            radius: 150
        });

        // Fire stakes have enhanced visibility without overwhelming animation

        // Add the stake marker
        // Use larger markers in fullscreen mode
        const markerScale = window.isFullscreenMode ? 12 : 8;
        const strokeWeight = window.isFullscreenMode ? 3 : 2;
        
        const marker = new google.maps.Marker({
            position: { lat: stake.lat, lng: stake.lng },
            map: map,
            title: `Stake ${stake.id}`,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: markerScale,
                fillColor: getStatusColor(stake.status),
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: strokeWeight
            }
        });

        // Add label to the marker with custom styling
        const label = new google.maps.Marker({
            position: { lat: stake.lat + 0.0008, lng: stake.lng },
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0,
                fillOpacity: 0,
                strokeOpacity: 0
            },
            label: {
                text: `${stake.id}`,
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 'bold'
            }
        });

        // Create a custom div overlay for better label styling
        const labelDiv = document.createElement('div');
        labelDiv.className = 'stake-label-custom';
        labelDiv.innerHTML = `Stake ${stake.id}`;
        labelDiv.style.cssText = `
            position: absolute;
            background: ${getStatusColor(stake.status)};
            color: white;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            pointer-events: none;
            z-index: 1000;
            white-space: nowrap;
        `;

        // Position the label div (this is a simplified approach - in production you'd use proper overlays)
        const overlay = new google.maps.OverlayView();
        overlay.onAdd = function() {
            const panes = this.getPanes();
            panes.overlayLayer.appendChild(labelDiv);
        };
        overlay.draw = function() {
            const projection = this.getProjection();
            const position = projection.fromLatLngToDivPixel(new google.maps.LatLng(stake.lat + 0.001, stake.lng));
            labelDiv.style.left = (position.x - 25) + 'px';
            labelDiv.style.top = (position.y - 10) + 'px';
        };
        overlay.setMap(map);

        // Add click listener
        marker.addListener('click', () => {
            showStakeCard(stake.id);
        });

        markers.push(marker);
        stakeMarkers[stake.id] = marker; // Store marker by stake ID
        console.log(`Created marker for stake ${stake.id} at ${stake.lat}, ${stake.lng}`);
        
        // Add marker position to bounds for auto-zoom
        bounds.extend(marker.getPosition());
    });
    
    // Auto-zoom to fit all markers with maximum zoom limit
    if (markers.length > 0) {
        // Small delay to ensure markers are rendered
        setTimeout(() => {
            map.fitBounds(bounds);
            
            // Limit zoom level to prevent extreme close-up
            google.maps.event.addListenerOnce(map, 'bounds_changed', function() {
                if (map.getZoom() > 16) {
                    map.setZoom(16);
                }
            });
        }, 100);
    }
    
    // Add constellation connections between all stakes
    addConstellationConnections(stakePositions);
    
    // Add color-coded zones based on stake clusters
    addColorCodedZones(stakePositions);
    
    // Add fire detection label in center of fire triangle
    addFireDetectionLabel(stakePositions);
}

// Add constellation-style connections between all stakes
function addConstellationConnections(stakePositions) {
    // Create connections between all stakes like a constellation
    for (let i = 0; i < stakePositions.length; i++) {
        for (let j = i + 1; j < stakePositions.length; j++) {
            const stake1 = stakePositions[i];
            const stake2 = stakePositions[j];
            
            // Calculate distance to determine if we should connect (avoid too many long lines)
            const distance = Math.sqrt(
                Math.pow(stake1.lat - stake2.lat, 2) + 
                Math.pow(stake1.lng - stake2.lng, 2)
            );
            
            // Only connect stakes that are relatively close (creates natural constellation patterns)
            if (distance < 0.008) {
                // Determine line color based on worst status of the two stakes
                let lineColor = '#10b981'; // green default
                let lineWeight = 1;
                let lineOpacity = 0.4;
                
                if (stake1.status === 'danger' || stake2.status === 'danger') {
                    lineColor = '#ef4444'; // red
                    lineWeight = 3;
                    lineOpacity = 0.8;
                } else if (stake1.status === 'warning' || stake2.status === 'warning') {
                    lineColor = '#f59e0b'; // yellow
                    lineWeight = 2;
                    lineOpacity = 0.6;
                }
                
                const line = new google.maps.Polyline({
                    path: [
                        { lat: stake1.lat, lng: stake1.lng },
                        { lat: stake2.lat, lng: stake2.lng }
                    ],
                    geodesic: true,
                    strokeColor: lineColor,
                    strokeOpacity: lineOpacity,
                    strokeWeight: lineWeight,
                    map: map,
                    zIndex: 500
                });
                
                // Add pulsing animation for danger connections
                if (stake1.status === 'danger' || stake2.status === 'danger') {
                    animateConnectionLine(line);
                }
            }
        }
    }
}

// Add color-coded zones based on stake clusters and status
function addColorCodedZones(stakePositions) {
    // Group stakes by status and proximity to create zones
    const dangerStakes = stakePositions.filter(stake => stake.status === 'danger');
    const warningStakes = stakePositions.filter(stake => stake.status === 'warning');
    const normalStakes = stakePositions.filter(stake => stake.status === 'normal');
    
    // Create danger zone (red) around fire cluster
    if (dangerStakes.length >= 2) {
        createZonePolygon(dangerStakes, '#ef4444', 0.3);
    }
    
    // Create warning zones (yellow) around warning stakes
    warningStakes.forEach(stake => {
        const nearbyStakes = stakePositions.filter(s => {
            const distance = Math.sqrt(
                Math.pow(s.lat - stake.lat, 2) + 
                Math.pow(s.lng - stake.lng, 2)
            );
            return distance < 0.01; // Stakes within warning influence
        });
        
        if (nearbyStakes.length >= 2) {
            createZonePolygon(nearbyStakes, '#f59e0b', 0.2);
        }
    });
    
    // Create safe zones (green) around clusters of normal stakes
    const normalClusters = findStakeClusters(normalStakes, 0.012);
    normalClusters.forEach(cluster => {
        if (cluster.length >= 3) {
            createZonePolygon(cluster, '#10b981', 0.15);
        }
    });
}

// Helper function to create colored zone polygons
function createZonePolygon(stakes, color, opacity) {
    if (stakes.length < 3) return; // Need at least 3 points for a polygon
    
    // Create expanded boundary points around the stakes
    const boundary = createExpandedBoundary(stakes, 0.003); // Expand by ~300m
    
    const zonePolygon = new google.maps.Polygon({
        paths: boundary,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: opacity,
        map: map,
        zIndex: 100
    });
}

// Helper function to find clusters of stakes
function findStakeClusters(stakes, maxDistance) {
    const clusters = [];
    const visited = new Set();
    
    stakes.forEach((stake, index) => {
        if (visited.has(index)) return;
        
        const cluster = [stake];
        visited.add(index);
        
        // Find nearby stakes
        stakes.forEach((otherStake, otherIndex) => {
            if (visited.has(otherIndex)) return;
            
            const distance = Math.sqrt(
                Math.pow(stake.lat - otherStake.lat, 2) + 
                Math.pow(stake.lng - otherStake.lng, 2)
            );
            
            if (distance < maxDistance) {
                cluster.push(otherStake);
                visited.add(otherIndex);
            }
        });
        
        clusters.push(cluster);
    });
    
    return clusters;
}

// Helper function to create expanded boundary around stakes
function createExpandedBoundary(stakes, expansion) {
    // Calculate center point
    const centerLat = stakes.reduce((sum, stake) => sum + stake.lat, 0) / stakes.length;
    const centerLng = stakes.reduce((sum, stake) => sum + stake.lng, 0) / stakes.length;
    
    // Sort stakes by angle from center to create proper polygon
    const sortedStakes = stakes.sort((a, b) => {
        const angleA = Math.atan2(a.lat - centerLat, a.lng - centerLng);
        const angleB = Math.atan2(b.lat - centerLat, b.lng - centerLng);
        return angleA - angleB;
    });
    
    // Create expanded boundary points
    return sortedStakes.map(stake => {
        const angle = Math.atan2(stake.lat - centerLat, stake.lng - centerLng);
        return {
            lat: stake.lat + Math.sin(angle) * expansion,
            lng: stake.lng + Math.cos(angle) * expansion
        };
    });
}

// Animate the connection lines with a pulsing effect
function animateConnectionLine(line) {
    let opacity = 0.8;
    let increasing = false;
    
    setInterval(() => {
        if (increasing) {
            opacity += 0.1;
            if (opacity >= 1.0) {
                increasing = false;
            }
        } else {
            opacity -= 0.1;
            if (opacity <= 0.3) {
                increasing = true;
            }
        }
        
        line.setOptions({
            strokeOpacity: opacity
        });
    }, 200);
}

// Add "FIRE DETECTED!" label in center of fire triangle
function addFireDetectionLabel(stakePositions) {
    const fireStakes = stakePositions.filter(stake => stake.status === 'danger');
    
    if (fireStakes.length >= 3) {
        // Calculate center point of fire triangle
        const centerLat = fireStakes.reduce((sum, stake) => sum + stake.lat, 0) / fireStakes.length;
        const centerLng = fireStakes.reduce((sum, stake) => sum + stake.lng, 0) / fireStakes.length;
        
        // Use larger fire symbol in fullscreen mode
        const fireSize = window.isFullscreenMode ? 60 : 40;
        const fireScaledSize = window.isFullscreenMode ? 50 : 40;
        const fireAnchorX = window.isFullscreenMode ? 25 : 20;
        
        // Create fire symbol marker in center of triangle
        const fireSymbol = new google.maps.Marker({
            position: { lat: centerLat, lng: centerLng },
            map: map,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="${fireSize}" height="${fireSize}" viewBox="0 0 24 24" transform="rotate(180)">
                        <path fill="#FF4444" d="M12 23s8-6 8-13A8 8 0 0 0 4 10c0 7 8 13 8 13z"/>
                        <path fill="#FF6666" d="M12 20s6-4.5 6-10a6 6 0 0 0-12 0c0 5.5 6 10 6 10z"/>
                        <path fill="#FFAA44" d="M12 17s4-3 4-7a4 4 0 0 0-8 0c0 4 4 7 4 7z"/>
                        <path fill="#FFFF44" d="M12 14s2-1.5 2-4a2 2 0 0 0-4 0c0 2.5 2 4 2 4z"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(fireScaledSize, fireScaledSize),
                anchor: new google.maps.Point(fireAnchorX, 0)
            },
            zIndex: 1000
        });

        // Create invisible marker for label positioning
        const fireAlert = new google.maps.Marker({
            position: { lat: centerLat, lng: centerLng },
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0,
                fillOpacity: 0,
                strokeOpacity: 0
            },
            zIndex: 999
        });

        // Create custom fire alert overlay
        const fireAlertDiv = document.createElement('div');
        fireAlertDiv.className = 'fire-alert-label';
        fireAlertDiv.innerHTML = `
            <div class="fire-alert-content">
                <div class="fire-alert-text">FIRE DETECTED</div>
                <div class="fire-coordinates">
                    ${centerLat.toFixed(6)}°N, ${Math.abs(centerLng).toFixed(6)}°W
                </div>
            </div>
        `;
        fireAlertDiv.style.cssText = `
            position: absolute;
            background: rgba(239, 68, 68, 0.95);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
            pointer-events: none;
            z-index: 1001;
            text-align: center;
            backdrop-filter: blur(2px);
        `;

        // Position the fire alert overlay
        const fireOverlay = new google.maps.OverlayView();
        fireOverlay.onAdd = function() {
            const panes = this.getPanes();
            panes.overlayLayer.appendChild(fireAlertDiv);
        };
        fireOverlay.draw = function() {
            const projection = this.getProjection();
            const position = projection.fromLatLngToDivPixel(new google.maps.LatLng(centerLat, centerLng));
            // Position the label to the right side of the fire triangle
            fireAlertDiv.style.left = (position.x + 80) + 'px';
            fireAlertDiv.style.top = (position.y - 25) + 'px';
        };
        fireOverlay.setMap(map);
    }
}

// Get status color for markers
function getStatusColor(status) {
    switch(status) {
        case 'normal': return '#10b981';
        case 'warning': return '#f59e0b';
        case 'danger': return '#ef4444';
        default: return '#10b981';
    }
}

// Add native Google Maps style heat map control
function addHeatMapControl() {
    // Create the control container
    const controlDiv = document.createElement('div');
    controlDiv.style.cssText = `
        background-color: #fff;
        border: 2px solid #fff;
        border-radius: 3px;
        box-shadow: 0 2px 6px rgba(0,0,0,.3);
        cursor: pointer;
        margin-bottom: 22px;
        text-align: center;
    `;
    
    // Create the control button
    const controlUI = document.createElement('div');
    controlUI.style.cssText = `
        color: rgb(25,25,25);
        font-family: Roboto,Arial,sans-serif;
        font-size: 18px;
        line-height: 48px;
        padding-left: 12px;
        padding-right: 12px;
        user-select: none;
        font-weight: 500;
    `;
    
    controlUI.innerHTML = '<i class="fas fa-thermometer-half" style="margin-right: 5px;"></i>Heat Map';
    controlDiv.appendChild(controlUI);
    
    // Add hover effects (but respect active state)
    controlUI.addEventListener('mouseenter', () => {
        if (!controlUI.classList.contains('heat-map-active')) {
            controlUI.style.backgroundColor = '#f5f5f5';
        }
    });
    
    controlUI.addEventListener('mouseleave', () => {
        if (!controlUI.classList.contains('heat-map-active')) {
            controlUI.style.backgroundColor = '';
        }
    });
    
    // Add click handler with proper toggle state management
    let heatMapActive = false;
    controlUI.addEventListener('click', () => {
        console.log('Heat map button clicked, current state:', heatMapActive);
        
        if (heatMapActive) {
            // Disable heat map
            removeHeatMapOverlay();
            controlUI.style.backgroundColor = '#fff';
            controlUI.style.color = 'rgb(25,25,25)';
            controlUI.innerHTML = '<i class="fas fa-thermometer-half" style="margin-right: 5px;"></i>Heat Map';
            controlUI.classList.remove('heat-map-active');
            heatMapActive = false;
            console.log('Heat map disabled');
        } else {
            // Enable heat map
            addHeatMapOverlay();
            controlUI.style.backgroundColor = '#ff6b35';
            controlUI.style.color = 'white';
            controlUI.innerHTML = '<i class="fas fa-thermometer-half" style="margin-right: 5px; color: white;"></i>Heat Map ON';
            controlUI.classList.add('heat-map-active');
            heatMapActive = true;
            console.log('Heat map enabled');
        }
    });
    
    // Add the control to the map
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
}

// Add localized heat visualization around stakes only
function addHeatMapOverlay() {
    // Clear any existing heat overlays
    if (window.heatOverlays) {
        removeHeatMapOverlay();
    }
    
    // Initialize heat overlays array
    window.heatOverlays = [];
    
    // Get current stake data with real temperatures
    const stakes = Object.keys(stakeData).map(id => ({
        id: id,
        lat: getStakePosition(id).lat,
        lng: getStakePosition(id).lng,
        temp: stakeData[id].temperature,
        status: stakeData[id].status
    }));
    
    // Create localized heat circles around each stake
    stakes.forEach(stake => {
        // Calculate heat intensity based on actual temperature
        // Temperature range: 20-35°C mapped to intensity 0-1
        const tempIntensity = Math.max(0, Math.min(1, (stake.temp - 20) / 15));
        
        // Create heat color based on temperature
        let heatColor = '#10b981'; // Default green for cool
        let heatOpacity = 0.3;
        
        if (stake.temp >= 29) {
            heatColor = '#dc2626'; // Dark red for extreme heat
            heatOpacity = 0.7;
        } else if (stake.temp >= 27) {
            heatColor = '#ef4444'; // Red for high heat
            heatOpacity = 0.6;
        } else if (stake.temp >= 25) {
            heatColor = '#f59e0b'; // Orange for warm
            heatOpacity = 0.5;
        } else if (stake.temp >= 23) {
            heatColor = '#22c55e'; // Light green for normal
            heatOpacity = 0.4;
        }
        
        // Create multiple concentric circles for smooth heat glow effect
        for (let layer = 0; layer < 3; layer++) {
            const radius = 120 + (layer * 60); // 120, 180, 240 meters
            const layerOpacity = heatOpacity * (0.8 - layer * 0.2); // Fade outward
            
            const heatCircle = new google.maps.Circle({
                strokeColor: heatColor,
                strokeOpacity: 0,
                strokeWeight: 0,
                fillColor: heatColor,
                fillOpacity: layerOpacity,
                map: map,
                center: { lat: stake.lat, lng: stake.lng },
                radius: radius,
                zIndex: 300 - layer // Inner circles on top
            });
            
            window.heatOverlays.push(heatCircle);
        }
        
        // Add temperature label for hot stakes
        if (stake.temp >= 26) {
            const labelDiv = document.createElement('div');
            labelDiv.style.cssText = `
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: bold;
                font-family: Arial, sans-serif;
                text-align: center;
                pointer-events: none;
                z-index: 1000;
                border: 1px solid rgba(255,255,255,0.3);
                white-space: nowrap;
            `;
            labelDiv.textContent = `${stake.temp.toFixed(1)}°C`;
            
            const labelOverlay = new google.maps.OverlayView();
            labelOverlay.onAdd = function() {
                this.getPanes().overlayLayer.appendChild(labelDiv);
            };
            
            labelOverlay.draw = function() {
                const projection = this.getProjection();
                const position = projection.fromLatLngToDivPixel(
                    new google.maps.LatLng(stake.lat, stake.lng)
                );
                
                if (position) {
                    labelDiv.style.left = (position.x - 15) + 'px';
                    labelDiv.style.top = (position.y - 30) + 'px';
                }
            };
            
            labelOverlay.onRemove = function() {
                if (labelDiv.parentNode) {
                    labelDiv.parentNode.removeChild(labelDiv);
                }
            };
            
            labelOverlay.setMap(map);
            window.heatOverlays.push(labelOverlay);
        }
    });
    
    console.log('Localized heat visualization added for', stakes.length, 'stakes');
}

// Helper function to get stake coordinates
function getStakePosition(stakeId) {
    const positions = {
        'A': { lat: 36.7820, lng: -119.4145 },
        'B': { lat: 36.7765, lng: -119.4125 },
        'C': { lat: 36.7845, lng: -119.4220 },
        'D': { lat: 36.7735, lng: -119.4195 },
        'E': { lat: 36.7725, lng: -119.4155 },
        'F': { lat: 36.7800, lng: -119.4179 },
        'G': { lat: 36.7810, lng: -119.4190 },
        'H': { lat: 36.7790, lng: -119.4190 },
        'I': { lat: 36.7815, lng: -119.4235 },
        'J': { lat: 36.7750, lng: -119.4245 }
    };
    return positions[stakeId] || { lat: 36.7790, lng: -119.4190 };
}

// Remove heat map overlay
function removeHeatMapOverlay() {
    if (window.heatOverlays) {
        window.heatOverlays.forEach(overlay => {
            // Handle both circles and custom overlays
            if (overlay.setMap) {
                overlay.setMap(null);
            }
            if (overlay.onRemove) {
                overlay.onRemove();
            }
        });
        window.heatOverlays = [];
        console.log('Localized heat visualization removed');
    }
}

// Initialize stake data
function initializeStakeData() {
    stakeData = {
        A: {
            temperature: 22.8, // Cool, elevated, far from fire
            humidity: 65.234,
            moisture30: 42.567,
            moisture60: 38.123,
            moisture90: 35.789,
            airQuality: 'Good',
            smoke: 'Clear',
            flame: 'No Flame',
            battery: 87.456,
            location: '40.7128°N, 74.0060°W',
            status: 'normal'
        },
        B: {
            temperature: 24.6, // Valley heat retention
            humidity: 62.789,
            moisture30: 39.234,
            moisture60: 36.567,
            moisture90: 33.891,
            airQuality: 'Good',
            smoke: 'Clear',
            flame: 'No Flame',
            battery: 91.123,
            location: '40.7129°N, 74.0061°W',
            status: 'normal'
        },
        C: {
            temperature: 21.5, // Coolest due to high elevation
            humidity: 68.456,
            moisture30: 45.123,
            moisture60: 41.789,
            moisture90: 45.234,
            airQuality: 'Good',
            smoke: 'Clear',
            flame: 'No Flame',
            battery: 89.567,
            location: '40.7127°N, 74.0059°W',
            status: 'normal'
        },
        D: {
            temperature: 25.8, // Warmer valley position
            humidity: 64.123,
            moisture30: 41.456,
            moisture60: 37.789,
            moisture90: 34.123,
            airQuality: 'Good',
            smoke: 'Clear',
            flame: 'No Flame',
            battery: 85.234,
            location: '40.7130°N, 74.0062°W',
            status: 'normal'
        },
        E: {
            temperature: 27.1, // Fire influence starting
            humidity: 58.567,
            moisture30: 35.891,
            moisture60: 32.234,
            moisture90: 29.567,
            airQuality: 'Moderate',
            smoke: 'Clear',
            flame: 'No Flame',
            battery: 82.789,
            location: '40.7126°N, 74.0058°W',
            status: 'warning'
        },
        F: {
            temperature: 31.2, // Hottest - fire epicenter
            humidity: 45.123,
            moisture30: 28.456,
            moisture60: 25.789,
            moisture90: 22.123,
            airQuality: 'Poor',
            smoke: 'Detected',
            flame: 'Flame Detected',
            battery: 78.456,
            location: '40.7131°N, 74.0063°W',
            status: 'danger'
        },
        G: {
            temperature: 30.8, // Very hot, active fire
            humidity: 42.567,
            moisture30: 26.123,
            moisture60: 23.456,
            moisture90: 20.789,
            airQuality: 'Poor',
            smoke: 'Detected',
            flame: 'Flame Detected',
            battery: 76.234,
            location: '40.7132°N, 74.0065°W',
            status: 'danger'
        },
        H: {
            temperature: 31.0, // Near fire center heat
            humidity: 41.234,
            moisture30: 24.789,
            moisture60: 21.567,
            moisture90: 18.456,
            airQuality: 'Hazardous',
            smoke: 'Heavy Smoke',
            flame: 'Flame Detected',
            battery: 74.567,
            location: '40.7129°N, 74.0067°W',
            status: 'danger'
        },
        I: {
            temperature: 23.7, // Ridge cooling effect
            humidity: 64.567,
            moisture30: 43.234,
            moisture60: 39.567,
            moisture90: 36.789,
            airQuality: 'Good',
            smoke: 'Clear',
            flame: 'No Flame',
            battery: 88.234,
            location: '40.7125°N, 74.0055°W',
            status: 'normal'
        },
        J: {
            temperature: 24.2, // Valley warmth, distance cooling
            humidity: 67.234,
            moisture30: 44.567,
            moisture60: 41.234,
            moisture90: 38.567,
            airQuality: 'Good',
            smoke: 'Clear',
            flame: 'No Flame',
            battery: 90.567,
            location: '40.7123°N, 74.0071°W',
            status: 'normal'
        }
    };
}

// Create stake buttons
function createStakeButtons() {
    const buttonsContainer = document.getElementById('stake-buttons');
    buttonsContainer.innerHTML = '';

    Object.keys(stakeData).forEach(stakeId => {
        const stake = stakeData[stakeId];
        const button = document.createElement('button');
        button.className = `tab-btn ${stake.status} ${currentStake === stakeId ? 'active' : ''}`;
        button.setAttribute('data-stake', stakeId);
        button.innerHTML = `
            <div class="btn-header">
                <div class="btn-name">Stake ${stakeId}</div>
                <div class="btn-status ${stake.status}">${getStatusText(stake.status)}</div>
            </div>
            <div class="btn-details">
                ${stake.temperature.toFixed(1)}°C • Bat ${stake.battery.toFixed(0)}%
            </div>
        `;
        
        button.addEventListener('click', () => {
            // Check if this button is already active
            const isCurrentlyActive = button.classList.contains('active');
            
            if (isCurrentlyActive) {
                // Deselect: Clear all active states and highlights
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                clearMapHighlights();
                currentStake = null;
                
                // Hide all tab panes
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
            } else {
                // Select: Switch to this stake
                switchTab(stakeId);
                
                // Update active button
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
            }
        });
        
        buttonsContainer.appendChild(button);
    });
    
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'normal': return 'Normal';
        case 'warning': return 'Warning';
        case 'danger': return 'Fire Alert!';
        default: return 'Normal';
    }
}

// Show stake card details
function showStakeCard(stakeId) {
    const stake = stakeData[stakeId];
    if (!stake) return;

    // Check if this stake is already selected
    const isCurrentlySelected = currentStake === stakeId;
    
    if (isCurrentlySelected) {
        // Deselect: Clear all active states and highlights
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        clearMapHighlights();
        currentStake = null;
        
        // Hide all tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
    } else {
        // Select: Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-stake="${stakeId}"]`).classList.add('active');

        // Switch to tab
        switchTab(stakeId);
    }
}

// Setup tab switching
function setupTabSwitching() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const stakeId = btn.getAttribute('data-stake');
            
            // Check if this button is already active
            const isCurrentlyActive = btn.classList.contains('active');
            
            if (isCurrentlyActive) {
                // Deselect: Clear all active states and highlights
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                clearMapHighlights();
                currentStake = null;
                
                // Hide all tab panes
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
            } else {
                // Select: Switch to this stake
                switchTab(stakeId);
                
                // Update active button
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });
}

// Switch tab content
function switchTab(stakeId) {
    if (!stakeId) return; // Handle null/undefined stakeId
    
    currentStake = stakeId;
    
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // No demo tab handling needed anymore
    
    // Show selected tab pane
    const targetPane = document.getElementById(`tab-${stakeId}`);
    if (targetPane) {
        targetPane.classList.add('active');
    } else {
        // Create tab pane if it doesn't exist
        createTabPane(stakeId);
    }
    
    // Update sensor values
    updateSensorValues(stakeId);
    
    // Highlight corresponding stake on map
    highlightMapStake(stakeId);
}

// Create tab pane
function createTabPane(stakeId) {
    const tabContent = document.querySelector('.tab-content');
    const pane = document.createElement('div');
    pane.id = `tab-${stakeId}`;
    pane.className = 'tab-pane active';
    
    pane.innerHTML = `
        <div class="sensor-grid">
            <div class="sensor-card">
                <div class="sensor-icon">
                    <i class="fas fa-thermometer-half"></i>
                </div>
                <div class="sensor-info">
                    <h4>Temperature</h4>
                    <div class="sensor-value" id="temp-${stakeId}">--</div>
                </div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">
                    <i class="fas fa-tint"></i>
                </div>
                <div class="sensor-info">
                    <h4>Humidity</h4>
                    <div class="sensor-value" id="humidity-${stakeId}">--</div>
                </div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">
                    <i class="fas fa-water"></i>
                </div>
                <div class="sensor-info">
                    <h4>Soil Moisture (30cm)</h4>
                    <div class="sensor-value" id="moisture-30-${stakeId}">--</div>
                </div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">
                    <i class="fas fa-water"></i>
                </div>
                <div class="sensor-info">
                    <h4>Soil Moisture (60cm)</h4>
                    <div class="sensor-value" id="moisture-60-${stakeId}">--</div>
                </div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">
                    <i class="fas fa-water"></i>
                </div>
                <div class="sensor-info">
                    <h4>Soil Moisture (90cm)</h4>
                    <div class="sensor-value" id="moisture-90-${stakeId}">--</div>
                </div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">
                    <i class="fas fa-wind"></i>
                </div>
                <div class="sensor-info">
                    <h4>Air Quality</h4>
                    <div class="sensor-value" id="air-quality-${stakeId}">--</div>
                </div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">
                    <i class="fas fa-smog"></i>
                </div>
                <div class="sensor-info">
                    <h4>Smoke Sensor</h4>
                    <div class="sensor-value" id="smoke-${stakeId}">--</div>
                </div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">
                    <i class="fas fa-fire"></i>
                </div>
                <div class="sensor-info">
                    <h4>Flame Sensor</h4>
                    <div class="sensor-value" id="flame-${stakeId}">--</div>
                </div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">
                    <i class="fas fa-battery-three-quarters"></i>
                </div>
                <div class="sensor-info">
                    <h4>Battery</h4>
                    <div class="sensor-value" id="battery-${stakeId}">--</div>
                </div>
            </div>
            
            <div class="sensor-card">
                <div class="sensor-icon">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <div class="sensor-info">
                    <h4>Location</h4>
                    <div class="sensor-value" id="location-${stakeId}">--</div>
                </div>
            </div>
        </div>
    `;
    
    tabContent.appendChild(pane);
    updateSensorValues(stakeId);
}

// Highlight the corresponding stake on the map
function highlightMapStake(stakeId) {
    // Clear any existing highlights
    clearMapHighlights();
    
    // Get the marker for this stake
    const marker = stakeMarkers[stakeId];
    if (!marker) return;
    
    // Get marker position
    const position = marker.getPosition();
    
    // Create animated highlight circle
    const highlightCircle = new google.maps.Circle({
        strokeColor: '#3b82f6', // Blue highlight
        strokeOpacity: 0.8,
        strokeWeight: 4,
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        map: map,
        center: position,
        radius: 180, // Larger than regular stake circles
        zIndex: 1100 // Above everything else
    });
    
    // Store reference for cleanup
    window.stakeHighlight = highlightCircle;
    
    // Create subtle pulsing animation
    let scale = 1.0;
    let growing = true;
    
    const animateHighlight = () => {
        if (growing) {
            scale += 0.008; // Much slower growth rate
            if (scale >= 1.15) { // Smaller scale range for subtlety
                growing = false;
            }
        } else {
            scale -= 0.008; // Much slower shrink rate
            if (scale <= 1.0) {
                growing = true;
            }
        }
        
        // Update circle radius with animation
        if (window.stakeHighlight === highlightCircle) {
            highlightCircle.setRadius(180 * scale);
        }
    };
    
    // Start subtle pulsing animation (slower interval)
    window.stakeHighlightInterval = setInterval(animateHighlight, 120); // Much slower: 120ms vs 50ms
    
    // Also make the marker slightly larger and more prominent
    const currentIcon = marker.getIcon();
    const highlightIcon = {
        ...currentIcon,
        scale: (currentIcon.scale || 8) * 1.4, // Make it 40% larger
        strokeWeight: (currentIcon.strokeWeight || 2) + 2 // Thicker border
    };
    marker.setIcon(highlightIcon);
    
    // Store original icon for restoration
    window.originalMarkerIcon = currentIcon;
    window.highlightedMarker = marker;
    
    console.log(`Highlighted stake ${stakeId} on map`);
}

// Clear all map highlights
function clearMapHighlights() {
    // Remove highlight circle
    if (window.stakeHighlight) {
        window.stakeHighlight.setMap(null);
        window.stakeHighlight = null;
    }
    
    // Stop animation
    if (window.stakeHighlightInterval) {
        clearInterval(window.stakeHighlightInterval);
        window.stakeHighlightInterval = null;
    }
    
    // Restore marker to original size
    if (window.highlightedMarker && window.originalMarkerIcon) {
        window.highlightedMarker.setIcon(window.originalMarkerIcon);
        window.highlightedMarker = null;
        window.originalMarkerIcon = null;
    }
}

// Update sensor values
function updateSensorValues(stakeId) {
    const stake = stakeData[stakeId];
    if (!stake) return;

    document.getElementById(`temp-${stakeId}`).textContent = `${stake.temperature.toFixed(3)}°C`;
    document.getElementById(`humidity-${stakeId}`).textContent = `${stake.humidity.toFixed(3)}%`;
    document.getElementById(`moisture-30-${stakeId}`).textContent = `${stake.moisture30.toFixed(3)}%`;
    document.getElementById(`moisture-60-${stakeId}`).textContent = `${stake.moisture60.toFixed(3)}%`;
    document.getElementById(`moisture-90-${stakeId}`).textContent = `${stake.moisture90.toFixed(3)}%`;
    document.getElementById(`air-quality-${stakeId}`).textContent = stake.airQuality;
    document.getElementById(`smoke-${stakeId}`).textContent = stake.smoke;
    document.getElementById(`flame-${stakeId}`).textContent = stake.flame;
    document.getElementById(`battery-${stakeId}`).textContent = `${stake.battery.toFixed(3)}%`;
    document.getElementById(`location-${stakeId}`).textContent = stake.location;
}

// Setup modal controls
function setupModalControls() {
    // Close modal when clicking outside
    document.getElementById('ai-insights-modal').addEventListener('click', (e) => {
        if (e.target.id === 'ai-insights-modal') {
            closeModal();
        }
    });
}

// Show modal with dynamic content
function showModal() {
    updateAIInsights();
    document.getElementById('ai-insights-modal').style.display = 'block';
}

// Generate dynamic AI insights based on current stake data
function updateAIInsights() {
    const stakes = Object.keys(stakeData);
    const normalStakes = stakes.filter(id => stakeData[id].status === 'normal');
    const warningStakes = stakes.filter(id => stakeData[id].status === 'warning');
    const dangerStakes = stakes.filter(id => stakeData[id].status === 'danger');
    
    // Calculate averages
    const avgTemp = stakes.reduce((sum, id) => sum + stakeData[id].temperature, 0) / stakes.length;
    const avgHumidity = stakes.reduce((sum, id) => sum + stakeData[id].humidity, 0) / stakes.length;
    const lowBatteryStakes = stakes.filter(id => stakeData[id].battery < 85);
    
    let statusBadge = '';
    let summaryText = '';
    let conditionsText = '';
    let systemText = '';
    let recommendationsText = '';
    
    // Determine overall status and generate insights
    if (dangerStakes.length > 0) {
        statusBadge = '<div class="status-badge danger"><i class="fas fa-exclamation-triangle"></i>FIRE ALERT - IMMEDIATE ACTION REQUIRED</div>';
        const fireStakes = dangerStakes.join(', ');
        
        if (dangerStakes.length > 1) {
            summaryText = `<strong>🚨 CRITICAL FIRE CLUSTER DETECTED:</strong> Multiple stakes (${fireStakes}) are detecting coordinated fire activity! This appears to be a rapidly spreading wildfire with ${dangerStakes.length} connected ignition points. The fire is spreading through the connected detection zone - immediate large-scale emergency response required.`;
            conditionsText = `<strong>Fire Cluster Analysis:</strong> Primary ignition at Stake ${dangerStakes[0]} (${stakeData[dangerStakes[0]].temperature.toFixed(1)}°C, ${stakeData[dangerStakes[0]].humidity.toFixed(1)}% humidity) has spread to nearby stakes. Secondary fires detected at Stakes ${dangerStakes.slice(1).join(' and ')} with temperatures exceeding 29°C. Wind patterns and dry conditions are accelerating spread between detection points.`;
            recommendationsText = `<strong>EMERGENCY PROTOCOL ACTIVATED:</strong> 1) Multiple fire departments dispatched to cluster coordinates. 2) Evacuation zone expanded to include all areas between connected stakes. 3) Air support requested for coordinated suppression. 4) Emergency shelters activated. 5) Highway closure protocols initiated for safety corridors.`;
        } else {
            summaryText = `<strong>🚨 CRITICAL FIRE ALERT:</strong> Stake ${fireStakes} is detecting active fire conditions! Flame sensors have been triggered and smoke levels are elevated. This is not a drill - immediate emergency response is required.`;
            conditionsText = `<strong>Fire Conditions Detected:</strong> Stake ${dangerStakes[0]} shows temperature of ${stakeData[dangerStakes[0]].temperature.toFixed(1)}°C with humidity at ${stakeData[dangerStakes[0]].humidity.toFixed(1)}% - dangerously dry conditions. ${stakeData[dangerStakes[0]].smoke === 'Detected' ? 'Smoke particles detected in air. ' : ''}${stakeData[dangerStakes[0]].flame === 'Flame Detected' ? 'Open flames confirmed by optical sensors.' : ''}`;
            recommendationsText = `<strong>IMMEDIATE ACTIONS:</strong> 1) Emergency services have been automatically notified with GPS coordinates. 2) Evacuation protocols should be initiated for nearby areas. 3) Fire suppression systems activated. 4) All personnel should maintain safe distance from Stake ${dangerStakes[0]} location.`;
        }
    } else if (warningStakes.length > 0) {
        statusBadge = '<div class="status-badge warning"><i class="fas fa-exclamation-circle"></i>Warning Conditions</div>';
        summaryText = `<strong>⚠️ Warning Conditions:</strong> Stake${warningStakes.length > 1 ? 's' : ''} ${warningStakes.join(', ')} ${warningStakes.length > 1 ? 'are' : 'is'} showing elevated fire risk conditions. Temperature and dryness levels are approaching dangerous thresholds.`;
        conditionsText = `<strong>Environmental Conditions:</strong> Warning zone${warningStakes.length > 1 ? 's' : ''} showing temperature averaging ${warningStakes.reduce((sum, id) => sum + stakeData[id].temperature, 0) / warningStakes.length}°C with reduced humidity at ${warningStakes.reduce((sum, id) => sum + stakeData[id].humidity, 0) / warningStakes.length}%. Soil moisture levels are below optimal ranges.`;
        recommendationsText = `<strong>Preventive Actions:</strong> 1) Increase monitoring frequency for warning zones. 2) Pre-position fire suppression resources. 3) Issue fire weather warnings to local authorities. 4) Consider temporary restrictions on high-risk activities.`;
    } else {
        statusBadge = '<div class="status-badge normal"><i class="fas fa-check-circle"></i>Normal Operations</div>';
        summaryText = `<strong>System Status:</strong> All ${stakes.length} Agrinota Guardian stakes are reporting normal conditions. The detection network is operating at optimal efficiency with no immediate fire threats detected.`;
        conditionsText = `<strong>Environmental Conditions:</strong> Temperature readings average ${avgTemp.toFixed(1)}°C with humidity at ${avgHumidity.toFixed(1)}%, creating stable conditions. Air quality remains excellent across all monitoring points with no smoke or flame detection.`;
        recommendationsText = `<strong>Maintenance Notes:</strong> Continue current monitoring schedule. ${lowBatteryStakes.length > 0 ? `Schedule battery replacement for Stake${lowBatteryStakes.length > 1 ? 's' : ''} ${lowBatteryStakes.join(', ')} within the next 2 weeks.` : 'All battery levels are optimal.'}`;
    }
    
    systemText = `<strong>Network Status:</strong> All ${stakes.length} sensor stakes are online and transmitting data every 2 seconds. ${lowBatteryStakes.length === 0 ? 'All batteries above 85% capacity.' : `${lowBatteryStakes.length} stake${lowBatteryStakes.length > 1 ? 's' : ''} showing lower battery levels but still operational.`} Mesh network connectivity is strong with no communication gaps detected.`;
    
    // Update the modal content
    const modalContent = `
        <div class="overall-status">
            ${statusBadge}
        </div>
        <div class="insight-text">
            <p>${summaryText}</p>
            <p>${conditionsText}</p>
            <p>${systemText}</p>
            <p>${recommendationsText}</p>
        </div>
    `;
    
    document.querySelector('.insight-content').innerHTML = modalContent;
    
    // Update the floating AI button based on alert status
    updateFloatingAIButton(dangerStakes.length > 0, warningStakes.length > 0);
}

// Update floating AI button appearance based on alert status
function updateFloatingAIButton(hasFire, hasWarning) {
    const aiButton = document.querySelector('.floating-ai-btn');
    if (!aiButton) return;
    
    // Remove existing classes
    aiButton.classList.remove('fire-alert', 'warning-alert', 'normal-status');
    
    if (hasFire) {
        aiButton.classList.add('fire-alert');
        aiButton.title = '🚨 FIRE ALERT - Click for Emergency Details';
    } else if (hasWarning) {
        aiButton.classList.add('warning-alert');
        aiButton.title = '⚠️ Warning Conditions - Click for Details';
    } else {
        aiButton.classList.add('normal-status');
        aiButton.title = '✅ All Systems Normal - Click for AI Insights';
    }
}

// Close modal
function closeModal() {
    document.getElementById('ai-insights-modal').style.display = 'none';
}

// Start data simulation
function startDataSimulation() {
    // Simulate real-time data updates
    setInterval(() => {
        // Update Stake F (fire scenario) with dynamic values
        if (stakeData.F) {
            stakeData.F.temperature += (Math.random() - 0.5) * 0.5;
            stakeData.F.temperature = Math.max(25, Math.min(32, stakeData.F.temperature));
            
            stakeData.F.humidity += (Math.random() - 0.5) * 2;
            stakeData.F.humidity = Math.max(40, Math.min(70, stakeData.F.humidity));
            
            // Update current tab if it's Stake F
            if (currentStake === 'F') {
                updateSensorValues('F');
            }
        }
        
        // Update other stakes with minor variations
        ['A', 'B', 'C', 'D', 'E'].forEach(stakeId => {
            if (stakeData[stakeId]) {
                stakeData[stakeId].temperature += (Math.random() - 0.5) * 0.2;
                stakeData[stakeId].temperature = Math.max(22, Math.min(27, stakeData[stakeId].temperature));
                
                if (currentStake === stakeId) {
                    updateSensorValues(stakeId);
                }
            }
        });
        
        // Update stake buttons
        createStakeButtons();
        
        // Update AI button status
        const dangerStakes = Object.keys(stakeData).filter(id => stakeData[id].status === 'danger');
        const warningStakes = Object.keys(stakeData).filter(id => stakeData[id].status === 'warning');
        updateFloatingAIButton(dangerStakes.length > 0, warningStakes.length > 0);
    }, 3000);
}

// Global function for modal close (called from HTML)
window.closeModal = closeModal;

// Demo Tab Functions
let demoInterval = null;
let chartInstance = null;

// Start simulation for demo
function startSimulation() {
    if (demoInterval) return; // Already running
    
    const startBtn = document.querySelector('.action-btn.primary');
    startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Simulation';
    startBtn.onclick = pauseSimulation;
    
    // Initialize chart if not exists
    if (!chartInstance) {
        initializeDemoChart();
    }
    
    // Start animated updates
    demoInterval = setInterval(() => {
        updateDemoValues();
        updateChart();
    }, 2000);
}

// Pause simulation
function pauseSimulation() {
    if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
        
        const startBtn = document.querySelector('.action-btn.primary');
        startBtn.innerHTML = '<i class="fas fa-play"></i> Start Simulation';
        startBtn.onclick = startSimulation;
    }
}

// Reset demo
function resetDemo() {
    pauseSimulation();
    
    // Reset values
    document.getElementById('crop-health').textContent = '92';
    document.getElementById('irrigation-status').textContent = 'Active';
    
    // Reset zones
    document.querySelectorAll('.zone').forEach((zone, index) => {
        zone.classList.toggle('active', index === 0);
    });
    
    // Reset chart
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}

// Update demo values with animation
function updateDemoValues() {
    // Update crop health
    const cropHealth = document.getElementById('crop-health');
    const currentHealth = parseInt(cropHealth.textContent);
    const newHealth = Math.max(85, Math.min(98, currentHealth + (Math.random() - 0.5) * 5));
    cropHealth.textContent = Math.round(newHealth);
    
    // Update trend
    const trend = document.querySelector('.metric-trend');
    const trendValue = ((newHealth - currentHealth) * 0.8).toFixed(1);
    trend.innerHTML = `<i class="fas fa-arrow-${trendValue >= 0 ? 'up' : 'down'}"></i> ${Math.abs(trendValue)}% from last hour`;
    trend.className = `metric-trend ${trendValue >= 0 ? 'positive' : 'negative'}`;
    
    // Rotate irrigation zones
    const zones = document.querySelectorAll('.zone');
    const activeIndex = Array.from(zones).findIndex(z => z.classList.contains('active'));
    zones.forEach(z => z.classList.remove('active'));
    zones[(activeIndex + 1) % zones.length].classList.add('active');
    
    // Update weather randomly
    if (Math.random() > 0.8) {
        const conditions = [
            { icon: 'fa-sun', temp: '28°C', desc: 'Sunny' },
            { icon: 'fa-cloud-sun', temp: '26°C', desc: 'Partly Cloudy' },
            { icon: 'fa-cloud', temp: '24°C', desc: 'Cloudy' }
        ];
        const weather = conditions[Math.floor(Math.random() * conditions.length)];
        document.querySelector('.weather-icon i').className = `fas ${weather.icon}`;
        document.querySelector('.temp').textContent = weather.temp;
        document.querySelector('.condition').textContent = weather.desc;
    }
}

// Initialize demo chart
function initializeDemoChart() {
    const canvas = document.getElementById('demo-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.5)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0.0)');
    
    // Mock chart data
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = labels.map(() => Math.random() * 20 + 30);
    
    // Simple chart drawing (mock implementation)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    
    // Draw simple line chart
    const width = canvas.width / labels.length;
    ctx.beginPath();
    data.forEach((value, index) => {
        const x = index * width + width / 2;
        const y = canvas.height - (value / 50) * canvas.height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

// Update chart with new data
function updateChart() {
    if (!chartInstance) initializeDemoChart();
}









// Global functions for HTML onclick
window.startSimulation = startSimulation;
window.resetDemo = resetDemo;

// Backup fullscreen detection on window load
window.addEventListener('load', function() {
    detectAndApplyDisplayMode();
    console.log('Window loaded - applying fullscreen detection');
});

// Function to detect display mode and apply appropriate styles
function detectAndApplyDisplayMode() {
    // Check if we're running in an iframe (widget mode) or standalone (fullscreen mode)
    const isInIframe = window.self !== window.top;
    
    // Get the dashboard element
    const dashboard = document.querySelector('.dashboard');
    
    // Force fullscreen mode for debugging - we can also check URL
    const isStandalone = !isInIframe || window.location.href.includes('demo.html');
    
    if (isStandalone) {
        // We're in fullscreen mode - apply responsive styles
        dashboard.classList.add('fullscreen');
        
        // Also apply fullscreen styles to body
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.height = '100vh';
        document.body.style.overflow = 'hidden';
        
        // Set flag for fullscreen mode to be used by other functions
        window.isFullscreenMode = true;
        
        console.log('Demo running in fullscreen mode - Dashboard classes:', dashboard.classList.toString());
        console.log('Body styles applied:', {
            margin: document.body.style.margin,
            padding: document.body.style.padding,
            height: document.body.style.height
        });
    } else {
        // We're in widget mode - keep default styles
        window.isFullscreenMode = false;
        console.log('Demo running in widget mode');
    }
}