// =========================================================================
// ۱. آدرس‌های نهایی پروژه (با لینک‌های نهایی شما)
// =========================================================================

// آدرس CSV نهایی گوگل شیت که شما منتشر کردید
const SHEET_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR71KesL1HDhke0Y-CKlideg_HzLQe8_pY4ySxqGv6mHdo7uzQJvGAum7X0Y_EPDfsooa5U4aG6hD1K/pub?gid=0&single=true&output=csv'; 

// آدرس پایه اصلاح شده برای نمایش تصاویر گوگل درایو
// (این فرمت سازگارتر با نمایش عمومی تصاویر در درایو است)
const DRIVE_BASE_URL = 'https://drive.google.com/uc?id='; 

// =========================================================================
// ۲. تابع ساخت کارت و رندر
// =========================================================================

function createMemberCard(member) {
    const fileId = member.FileID; 
    
    // ترکیب آدرس پایه اصلاح شده با File ID
    const imageURL = fileId ? (DRIVE_BASE_URL + fileId) : 'https://via.placeholder.com/250x250.png?text=Image+Missing'; 
    
    const name = member['نام نماینده'] || 'نام نامشخص';
    const constituency = member['حوزه انتخابیه'] || 'حوزه نامشخص';
    const commission = member['کمیسیون'] || 'کمیسیون نامشخص';

    return `
        <div class="member-card">
            <img class="member-image" src="${imageURL}" alt="تصویر ${name}" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/250x250.png?text=Image+Missing';">
            <div class="member-info">
                <h4>${name}</h4>
                <p><strong>حوزه:</strong> ${constituency}</p>
                <p><strong>کمیسیون:</strong> ${commission}</p>
            </div>
        </div>
    `;
}

// =========================================================================
// ۳. توابع پشتیبانی (CSV to JSON) و اجرای اصلی
// =========================================================================

function csvToJson(csv) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',').map(item => item.trim().replace(/"/g, ''));
        if (currentLine.length !== headers.length) continue;

        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentLine[j];
        }
        result.push(obj);
    }
    return result;
}

async function loadMembers() {
    const container = document.getElementById('members-container');
    container.innerHTML = '<div class="loading">در حال بارگذاری داده‌ها...</div>'; 

    try {
        const response = await fetch(SHEET_DATA_URL);
        
        if (!response.ok) {
            throw new Error(`خطا در دسترسی به شیت گوگل: وضعیت ${response.status}.`);
        }
        
        const csvText = await response.text();
        const membersData = csvToJson(csvText);
        
        if (membersData.length === 0) {
            container.innerHTML = '<div class="error">هیچ داده‌ای در شیت پیدا نشد.</div>';
            return;
        }

        let allCardsHTML = '';
        membersData.forEach(member => {
            allCardsHTML += createMemberCard(member);
        });
        
        container.innerHTML = allCardsHTML;

    } catch (error) {
        console.error('خطا در بارگذاری داده‌ها:', error);
        container.innerHTML = `<div class="error">مشکل بحرانی در بارگذاری: ${error.message}</div>`;
    }
}

loadMembers();