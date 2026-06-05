// Daily Account — dashboard.js v3.5 — Android 9 compatible

function loadDashboard() {
    var income  = DB.sum('income',  'amount');
    var expense = DB.sum('expense', 'amount');
    var savings = DB.sum('savings', 'amount');

    var ledger = DB.get('ledger') || [];
    var paidDena=0, paidPabona=0, unpaidDena=0, unpaidPabona=0;
    ledger.forEach(function(item) {
        if (item.paid) {
            if (item.type==='dena') paidDena += Number(item.amount||0);
            else paidPabona += Number(item.amount||0);
        } else {
            if (item.type==='dena') unpaidDena += Number(item.amount||0);
            else unpaidPabona += Number(item.amount||0);
        }
    });

    var balance = income - expense + paidPabona - paidDena - savings;

    function sv(id, v) { var el=document.getElementById(id); if(el) el.textContent=v; }
    sv('mainBalance',  '৳ ' + Math.round(balance));
    sv('totalIncome',  '৳ ' + Math.round(income));
    sv('totalExpense', '৳ ' + Math.round(expense));
    sv('totalDena',    '৳ ' + Math.round(unpaidDena));
    sv('totalPabona',  '৳ ' + Math.round(unpaidPabona));
    sv('totalSavings', '৳ ' + Math.round(savings));

    loadSmartAdvice(income, expense, balance, savings, unpaidDena, unpaidPabona);
    loadSmartBadge(income, expense, savings);
}

function loadSmartAdvice(income, expense, balance, savings, unpaidDena, unpaidPabona) {
    var savingsRate  = income > 0 ? (savings / income) * 100 : 0;
    var expenseRate  = income > 0 ? (expense / income) * 100 : 0;
    var balanceRate  = income > 0 ? (balance / income) * 100 : 0;
    var denaRate     = income > 0 ? (unpaidDena / income) * 100 : 0;
    var pabonaRate   = income > 0 ? (unpaidPabona / income) * 100 : 0;

    var advice = '';
    var advices = [];

    if (expense > income * 2) {
        advices = ['🚨 অতি জরুরি! ব্যয় আয়ের দ্বিগুণ। সকল অপ্রয়োজনীয় খরচ বন্ধ করুন।','🚨 আর্থিক সংকট! আয়ের তুলনায় ব্যয় অনেক বেশি। জরুরি বাজেট পরিকল্পনা করুন।','🚨 বিপদসীমা অতিক্রম! এই হারে গুরুতর ঋণে পড়বেন। আজই খরচ কমান।'];
    } else if (expense > income * 1.5) {
        advices = ['🚨 গুরুতর! ব্যয় আয়ের ১৫০%। অবিলম্বে খরচ কমান।','🚨 আর্থিক চাপ বাড়ছে! প্রতিদিনের খরচের তালিকা করুন।','🚨 এই মাসে নতুন কোনো খরচ করবেন না।'];
    } else if (expense > income * 1.2) {
        advices = ['⚠️ ব্যয় আয়ের ২০% বেশি। অপ্রয়োজনীয় খরচ বন্ধ করুন।','⚠️ খরচ নিয়ন্ত্রণে আনুন! মাসিক বাজেট তৈরি করুন।'];
    } else if (expense > income) {
        advices = ['⚠️ এই মাসে ব্যয় আয়ের চেয়ে বেশি। দ্রুত খরচ কমান।','⚠️ ঋণের ঝুঁকি! আয়ের চেয়ে বেশি খরচ হচ্ছে।'];
    } else if (unpaidDena > income * 0.7) {
        advices = ['📕 দেনার বোঝা অসহনীয়! ঋণদাতাদের সাথে কিস্তি চুক্তি করুন।','📕 জরুরি! প্রতি মাসে আয়ের ৩০% দেনা পরিশোধে রাখুন।'];
    } else if (unpaidDena > income * 0.5) {
        advices = ['📕 দেনার চাপ অত্যধিক! নির্দিষ্ট লক্ষ্যে পরিশোধ শুরু করুন।','📕 দেনা কমান! অপ্রয়োজনীয় খরচ বাদ দিয়ে পরিশোধ করুন।'];
    } else if (unpaidDena > income * 0.3) {
        advices = ['📕 দেনা পরিশোধ অগ্রাধিকার দিন। প্রতি মাসে নির্দিষ্ট লক্ষ্য রাখুন।','📕 মাসিক আয়ের ২০% দেনা পরিশোধে রাখুন।'];
    } else if (unpaidDena > income * 0.15) {
        advices = ['📕 দেনা নিয়ন্ত্রণে রাখুন! ছোট থাকতেই পরিশোধ করুন।','📕 ঋণমুক্ত হওয়ার সুযোগ! আগামী ৩-৬ মাসে শোধ করুন।'];
    } else if (savings === 0 && income > 0) {
        advices = ['💡 সঞ্চয় শুরু করুন! আয়ের অন্তত ১০-২০% সঞ্চয় করুন।','💡 ভবিষ্যতের জন্য সঞ্চয় অত্যন্ত জরুরি! আজ থেকেই শুরু করুন।'];
    } else if (savingsRate < 5 && income > 0) {
        advices = ['💰 সঞ্চয় খুবই কম! লক্ষ্য হওয়া উচিত ১৫-২০%।','💰 অপ্রয়োজনীয় খরচ কমিয়ে সঞ্চয় বাড়ান।'];
    } else if (savingsRate < 10 && income > 0) {
        advices = ['💰 সঞ্চয়ের হার বাড়ান! লক্ষ্য রাখুন ২০%।','💰 এগিয়ে যাচ্ছেন! সঞ্চয় ধীরে ধীরে বাড়ান।'];
    } else if (savingsRate >= 40) {
        advices = ['🎉 অসাধারণ! আয়ের ৪০%+ সঞ্চয়! আপনি সত্যিকারের আর্থিক বিশেষজ্ঞ!','🎉 চ্যাম্পিয়ন সেভার! ভবিষ্যৎ উজ্জ্বল!'];
    } else if (savingsRate >= 30) {
        advices = ['🎉 দুর্দান্ত! আয়ের ৩০%+ সঞ্চয়! অভিনন্দন!','🎉 সুপার সেভার! এভাবেই চলুন!'];
    } else if (savingsRate >= 20) {
        advices = ['🎉 দুর্দান্ত সঞ্চয়ের অভ্যাস! আয়ের ২০%+ সঞ্চয় প্রশংসনীয়।','🎉 স্মার্ট সেভার! আর্থিক লক্ষ্য অর্জনের পথে!'];
    } else if (savingsRate >= 15) {
        advices = ['💎 ভালো সঞ্চয় হচ্ছে! লক্ষ্য ২০-২৫%।','💎 সঠিক পথে আছেন! ধীরে ধীরে বাড়ান।'];
    } else if (expenseRate > 90) {
        advices = ['⚠️ ব্যয় অত্যধিক! আয়ের ৯০%+ খরচ। সঞ্চয়ের জায়গা নেই।','⚠️ মাসিক বাজেট তৈরি করুন।'];
    } else if (expenseRate > 80) {
        advices = ['⚠️ ব্যয় নিয়ন্ত্রণ করুন। আয়ের ৮০% ব্যয়। সঞ্চয়ের জায়গা কম।','⚠️ খরচ কমিয়ে ২০% সঞ্চয়ের লক্ষ্য রাখুন।'];
    } else if (expenseRate > 70) {
        advices = ['⚡ খরচ কিছুটা বেশি! সঞ্চয় বাড়ানোর চেষ্টা করুন।'];
    } else if (expenseRate < 40) {
        advices = ['🎯 চমৎকার! আয়ের মাত্র ' + Math.round(expenseRate) + '% ব্যয়। অসাধারণ!'];
    } else if (expenseRate < 50) {
        advices = ['🎯 খুব ভালো ব্যয় নিয়ন্ত্রণ! চালিয়ে যান!'];
    } else if (expenseRate < 60) {
        advices = ['✅ ব্যয় ভালো নিয়ন্ত্রণে! এই হার বজায় রাখুন।'];
    } else if (unpaidPabona > income * 0.5) {
        advices = ['📗 পাওনা আদায় করুন! আয়ের ৫০%+ টাকা বাকি।'];
    } else if (unpaidPabona > income * 0.3) {
        advices = ['📗 পাওনা আদায়ে মনোযোগ দিন! নিয়মিত ফলোআপ করুন।'];
    } else if (balance > income * 0.5) {
        advices = ['🎉 অসাধারণ! আয়ের ৫০%+ হাতে থাকছে। দুর্দান্ত পরিকল্পনা!'];
    } else if (balance > income * 0.3) {
        advices = ['🎊 চমৎকার! আয়ের ৩০%+ হাতে থাকছে। ভালো সঞ্চয় হচ্ছে!'];
    } else if (balance > income * 0.1) {
        advices = ['✅ মোটামুটি ভালো! আয়ের ১০%+ হাতে থাকছে।'];
    } else if (balance > 0) {
        advices = ['✅ ভালো চলছে! ইতিবাচক ব্যালেন্স বজায় রাখুন।'];
    } else if (balance === 0) {
        advices = ['⚖️ ব্যালেন্স শূন্য! সঞ্চয়ের জন্য খরচ কমান বা আয় বাড়ান।'];
    } else {
        advices = ['💰 আয় এবং ব্যয় ট্র্যাক করতে থাকুন! প্রতিদিনের হিসাব রাখা গুরুত্বপূর্ণ।'];
    }

    advice = advices[Math.floor(Math.random() * advices.length)];
    var el = document.getElementById('adviceText');
    if (el) el.textContent = advice;
}

function loadSmartBadge(income, expense, savings) {
    var savingsRate = income > 0 ? (savings / income) * 100 : 0;
    var expenseRate = income > 0 ? (expense / income) * 100 : 0;
    var badge = {title:'ট্র্যাক করুন 📊', desc:'হিসাব রাখা চালিয়ে যান', icon:'📊'};

    if (savingsRate >= 40) {
        badge = {title:'মহান সঞ্চয়কারী 👑', desc:'আয়ের ৪০%+ সঞ্চয়!', icon:'👑'};
    } else if (savingsRate >= 30) {
        badge = {title:'সুপার সেভার 🌟', desc:'আয়ের ৩০%+ সঞ্চয়!', icon:'🌟'};
    } else if (savingsRate >= 20) {
        badge = {title:'স্মার্ট সেভার 💎', desc:'দুর্দান্ত সঞ্চয়ের অভ্যাস!', icon:'💎'};
    } else if (savingsRate >= 15) {
        badge = {title:'ভালো সেভার 💚', desc:'সঞ্চয় চালিয়ে যান!', icon:'💚'};
    } else if (expenseRate < 40) {
        badge = {title:'ব্যয় নিয়ন্ত্রক 🎯', desc:'খরচ দুর্দান্ত নিয়ন্ত্রণে!', icon:'🎯'};
    } else if (expenseRate < 60) {
        badge = {title:'ভালো ব্যালেন্স ✅', desc:'আয়-ব্যয় সুষম', icon:'✅'};
    } else if (expenseRate > 90) {
        badge = {title:'জরুরি পদক্ষেপ 🚨', desc:'খরচ কমান এখনই', icon:'🚨'};
    } else if (expenseRate > 80) {
        badge = {title:'সতর্ক থাকুন ⚠️', desc:'ব্যয় বেশি হচ্ছে', icon:'⚠️'};
    }

    var badgeEl = document.getElementById('smartBadge');
    if (badgeEl) {
        var iconEl = badgeEl.querySelector('.badge-icon');
        if (iconEl) iconEl.textContent = badge.icon;
    }
    var titleEl = document.getElementById('badgeTitle');
    var descEl  = document.getElementById('badgeDesc');
    if (titleEl) titleEl.textContent = badge.title;
    if (descEl)  descEl.textContent  = badge.desc;
}

document.addEventListener('DOMContentLoaded', loadDashboard);
