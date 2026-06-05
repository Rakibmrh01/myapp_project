// Daily Account - Calculator Module

let currentExpression = '';
let currentResult = '0';

function updateDisplay() {
    document.getElementById('expression').textContent = currentExpression || '';
    document.getElementById('result').textContent = currentResult;
}

function appendNumber(num) {
    if (currentResult === '0' && num !== '.') {
        currentResult = num;
    } else {
        currentResult += num;
    }
    currentExpression += num;
    updateDisplay();
}

function appendOperator(op) {
    if (currentExpression === '') return;
    
    const lastChar = currentExpression[currentExpression.length - 1];
    if (['+', '-', '*', '/', '%'].includes(lastChar)) {
        currentExpression = currentExpression.slice(0, -1);
    }
    
    currentExpression += op;
    currentResult = '0';
    updateDisplay();
    
    // Update display with proper symbol
    const displayOp = {
        '*': '×',
        '/': '÷',
        '-': '−'
    };
    const expr = document.getElementById('expression').textContent;
    document.getElementById('expression').textContent = 
        expr.slice(0, -1) + (displayOp[op] || op);
}

function calculate() {
    if (currentExpression === '') return;
    
    try {
        const result = eval(currentExpression);
        
        if (isNaN(result) || !isFinite(result)) {
            currentResult = 'Error';
        } else {
            currentResult = result.toString();
            
            if (currentResult.includes('.')) {
                currentResult = parseFloat(result).toFixed(2);
            }
        }
        
        currentExpression = '';
        updateDisplay();
        
    } catch (error) {
        currentResult = 'Error';
        currentExpression = '';
        updateDisplay();
    }
}

function clearAll() {
    currentExpression = '';
    currentResult = '0';
    updateDisplay();
}

function backspace() {
    if (currentExpression === '') return;
    
    currentExpression = currentExpression.slice(0, -1);
    
    if (currentExpression === '') {
        currentResult = '0';
    } else {
        try {
            const lastChar = currentExpression[currentExpression.length - 1];
            if (!['+', '-', '*', '/', '%'].includes(lastChar)) {
                currentResult = eval(currentExpression).toString();
            }
        } catch (e) {
            currentResult = currentResult.slice(0, -1) || '0';
        }
    }
    
    updateDisplay();
}

// Keyboard Support
document.addEventListener('keydown', function(e) {
    if (e.key >= '0' && e.key <= '9') {
        appendNumber(e.key);
    } else if (e.key === '.') {
        appendNumber('.');
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        appendOperator(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
        calculate();
    } else if (e.key === 'Backspace') {
        backspace();
    } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        clearAll();
    }
});

updateDisplay();