// CSS Changer - Enhanced Version
// Loads saved settings and applies them

document.addEventListener('DOMContentLoaded', () => {
    loadSavedSettings();
    attachEventListeners();
    setTimeout(function(){ if(typeof _initColorPickers==='function') _initColorPickers(); },300);
});

function loadSavedSettings() {
    const config = DB.get('cssConfig') || getDefaultConfig();
    
    // Color inputs
    document.getElementById('primaryColor').value = config.primaryColor || '#2563eb';
    document.getElementById('incomeColor').value = config.incomeColor || '#16a34a';
    document.getElementById('expenseColor').value = config.expenseColor || '#dc2626';
    document.getElementById('denaColor').value = config.denaColor || '#ea580c';
    document.getElementById('pabonaColor').value = config.pabonaColor || '#0891b2';
    document.getElementById('savingsColor').value = config.savingsColor || '#9333ea';
    document.getElementById('bgColor').value = config.bgColor || '#f0f4f8';
    document.getElementById('cardBgColor').value = config.cardBgColor || '#ffffff';
    
    // Range inputs
    document.getElementById('fontSize').value = config.fontSize || 17;
    document.getElementById('cardRadius').value = config.cardRadius || 12;
    document.getElementById('btnRadius').value = config.btnRadius || 10;
    document.getElementById('borderWidth').value = config.borderWidth || 2;
    document.getElementById('shadowDepth').value = config.shadowDepth || 2;
    document.getElementById('animSpeed').value = config.animSpeed || 300;
    document.getElementById('cardGap').value = config.cardGap || 0.2;
    document.getElementById('paddingSize').value = config.paddingSize || 0.5;
    
    // Checkboxes
    document.getElementById('cardBorder').checked = config.cardBorder !== false;
    document.getElementById('balanceBorder').checked = config.balanceBorder !== false;
    document.getElementById('cardShadow').checked = config.cardShadow !== false;
    document.getElementById('buttonShadow').checked = config.buttonShadow !== false;
    document.getElementById('buttonPress').checked = config.buttonPress !== false;
    document.getElementById('cardHover').checked = config.cardHover !== false;
    document.getElementById('glowAnimation').checked = config.glowAnimation !== false;
    document.getElementById('slideAnimation').checked = config.slideAnimation !== false;
    document.getElementById('fadeAnimation').checked = config.fadeAnimation !== false;
    document.getElementById('gradientBg').checked = config.gradientBg !== false;
    document.getElementById('blurEffect').checked = config.blurEffect || false;
    document.getElementById('transform3d').checked = config.transform3d || false;
    document.getElementById('neonEffect').checked = config.neonEffect || false;
    
    updateValueLabels();
    applyStyles(config);
}

function attachEventListeners() {
    // Range inputs - live update
    const rangeInputs = ['fontSize', 'cardRadius', 'btnRadius', 'borderWidth', 'shadowDepth', 'animSpeed', 'cardGap', 'paddingSize'];
    rangeInputs.forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('input', () => {
            updateValueLabels();
            previewChanges();
        });
    });
    
    // Color inputs - live update
    const colorInputs = ['primaryColor', 'incomeColor', 'expenseColor', 'denaColor', 'pabonaColor', 'savingsColor', 'bgColor', 'cardBgColor'];
    colorInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', previewChanges);
    });
    
    // Checkboxes - live update
    const checkboxes = ['cardBorder', 'balanceBorder', 'cardShadow', 'buttonShadow', 'buttonPress', 'cardHover', 'glowAnimation', 'slideAnimation', 'fadeAnimation', 'gradientBg', 'blurEffect', 'transform3d', 'neonEffect'];
    checkboxes.forEach(id => {
        document.getElementById(id).addEventListener('change', previewChanges);
    });
}

function updateValueLabels() {
    document.getElementById('fontSizeValue').textContent = document.getElementById('fontSize').value + 'px';
    document.getElementById('cardRadiusValue').textContent = document.getElementById('cardRadius').value + 'px';
    document.getElementById('btnRadiusValue').textContent = document.getElementById('btnRadius').value + 'px';
    document.getElementById('borderWidthValue').textContent = document.getElementById('borderWidth').value + 'px';
    document.getElementById('animSpeedValue').textContent = document.getElementById('animSpeed').value + 'ms';
    document.getElementById('cardGapValue').textContent = document.getElementById('cardGap').value + 'rem';
    document.getElementById('paddingSizeValue').textContent = document.getElementById('paddingSize').value + 'rem';
    
    const depth = document.getElementById('shadowDepth').value;
    const depthLabels = { '1': 'হালকা', '2': 'মধ্যম', '3': 'গভীর' };
    document.getElementById('shadowDepthValue').textContent = depthLabels[depth];
}

function getCurrentConfig() {
    return {
        primaryColor: document.getElementById('primaryColor').value,
        incomeColor: document.getElementById('incomeColor').value,
        expenseColor: document.getElementById('expenseColor').value,
        denaColor: document.getElementById('denaColor').value,
        pabonaColor: document.getElementById('pabonaColor').value,
        savingsColor: document.getElementById('savingsColor').value,
        bgColor: document.getElementById('bgColor').value,
        cardBgColor: document.getElementById('cardBgColor').value,
        fontSize: parseInt(document.getElementById('fontSize').value),
        cardRadius: parseInt(document.getElementById('cardRadius').value),
        btnRadius: parseInt(document.getElementById('btnRadius').value),
        borderWidth: parseInt(document.getElementById('borderWidth').value),
        shadowDepth: parseInt(document.getElementById('shadowDepth').value),
        animSpeed: parseInt(document.getElementById('animSpeed').value),
        cardGap: parseFloat(document.getElementById('cardGap').value),
        paddingSize: parseFloat(document.getElementById('paddingSize').value),
        cardBorder: document.getElementById('cardBorder').checked,
        balanceBorder: document.getElementById('balanceBorder').checked,
        cardShadow: document.getElementById('cardShadow').checked,
        buttonShadow: document.getElementById('buttonShadow').checked,
        buttonPress: document.getElementById('buttonPress').checked,
        cardHover: document.getElementById('cardHover').checked,
        glowAnimation: document.getElementById('glowAnimation').checked,
        slideAnimation: document.getElementById('slideAnimation').checked,
        fadeAnimation: document.getElementById('fadeAnimation').checked,
        gradientBg: document.getElementById('gradientBg').checked,
        blurEffect: document.getElementById('blurEffect').checked,
        transform3d: document.getElementById('transform3d').checked,
        neonEffect: document.getElementById('neonEffect').checked
    };
}

function applyStyles(config) {
    const root = document.documentElement;
    
    // Colors
    root.style.setProperty('--primary-color', config.primaryColor);
    root.style.setProperty('--income-color', config.incomeColor);
    root.style.setProperty('--expense-color', config.expenseColor);
    root.style.setProperty('--dena-color', config.denaColor);
    root.style.setProperty('--pabona-color', config.pabonaColor);
    root.style.setProperty('--savings-color', config.savingsColor);
    root.style.setProperty('--bg-main', config.bgColor);
    root.style.setProperty('--bg-card', config.cardBgColor);
    
    // Sizes
    root.style.setProperty('--base-font-size', config.fontSize + 'px');
    root.style.setProperty('--card-radius', config.cardRadius + 'px');
    root.style.setProperty('--btn-radius', config.btnRadius + 'px');
    root.style.setProperty('--anim-speed', config.animSpeed + 'ms');
    root.style.setProperty('--space-md', config.cardGap + 'rem');
    root.style.setProperty('--space-lg', config.paddingSize + 'rem');
    
    // Shadows
    const shadowSizes = {
        1: '0 2px 8px rgba(0,0,0,0.1)',
        2: '0 4px 12px rgba(0,0,0,0.15)',
        3: '0 8px 20px rgba(0,0,0,0.2)'
    };
    root.style.setProperty('--shadow-md', config.cardShadow ? shadowSizes[config.shadowDepth] : 'none');
    
    // Borders
    if (!config.cardBorder) {
        root.style.setProperty('--card-border', 'none');
    } else {
        root.style.setProperty('--card-border', config.borderWidth + 'px solid');
    }
}

function previewChanges() {
    const config = getCurrentConfig();
    applyStyles(config);
}

function saveCSS() {
    const config = getCurrentConfig();
    DB.set('cssConfig', config);
    applyStyles(config);
    showToast('✅ সেটিংস সংরক্ষিত হয়েছে!', 'success');
}

function resetCSS() {
    if (confirm('সব সেটিংস ডিফল্টে ফিরিয়ে আনবেন?')) {
        const defaultConfig = getDefaultConfig();
        DB.set('cssConfig', defaultConfig);
        location.reload();
    }
}

function getDefaultConfig() {
    return {
        primaryColor: '#2563eb',
        incomeColor: '#16a34a',
        expenseColor: '#dc2626',
        denaColor: '#ea580c',
        pabonaColor: '#0891b2',
        savingsColor: '#9333ea',
        bgColor: '#f0f4f8',
        cardBgColor: '#ffffff',
        fontSize: 17,
        cardRadius: 12,
        btnRadius: 10,
        borderWidth: 2,
        shadowDepth: 2,
        animSpeed: 300,
        cardGap: 0.2,
        paddingSize: 0.5,
        cardBorder: true,
        balanceBorder: true,
        cardShadow: true,
        buttonShadow: true,
        buttonPress: true,
        cardHover: true,
        glowAnimation: true,
        slideAnimation: true,
        fadeAnimation: true,
        gradientBg: true,
        blurEffect: false,
        transform3d: false,
        neonEffect: false
    };
}

function applyPreset(presetName) {
    const presets = {
        default: getDefaultConfig(),
        dark: {
            ...getDefaultConfig(),
            bgColor: '#111827',
            cardBgColor: '#1f2937',
            primaryColor: '#3b82f6'
        },
        ocean: {
            ...getDefaultConfig(),
            primaryColor: '#0891b2',
            incomeColor: '#06b6d4',
            expenseColor: '#ef4444',
            bgColor: '#ecfeff',
            cardBgColor: '#cffafe'
        },
        forest: {
            ...getDefaultConfig(),
            primaryColor: '#059669',
            incomeColor: '#10b981',
            savingsColor: '#16a34a',
            bgColor: '#f0fdf4',
            cardBgColor: '#dcfce7'
        },
        sunset: {
            ...getDefaultConfig(),
            primaryColor: '#f59e0b',
            incomeColor: '#fbbf24',
            expenseColor: '#dc2626',
            bgColor: '#fffbeb',
            cardBgColor: '#fef3c7'
        },
        purple: {
            ...getDefaultConfig(),
            primaryColor: '#9333ea',
            savingsColor: '#a855f7',
            pabonaColor: '#8b5cf6',
            bgColor: '#faf5ff',
            cardBgColor: '#f3e8ff'
        },
        minimal: {
            ...getDefaultConfig(),
            cardRadius: 4,
            btnRadius: 4,
            shadowDepth: 1,
            cardBorder: false,
            glowAnimation: false,
            gradientBg: false
        },
        vibrant: {
            ...getDefaultConfig(),
            incomeColor: '#10b981',
            expenseColor: '#ef4444',
            denaColor: '#fbbf24',
            pabonaColor: '#3b82f6',
            savingsColor: '#a855f7',
            shadowDepth: 3,
            neonEffect: true
        }
    };
    
    const config = presets[presetName] || presets.default;
    DB.set('cssConfig', config);
    location.reload();
}

function goBack() {
    window.history.back();
}