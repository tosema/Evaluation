// =========================================================================
// ۱. آدرس‌های نهایی شما
// =========================================================================

// آدرس CSV نهایی گوگل شیت که شما ارسال کردید
const SHEET_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR71KesL1HDhke0Y-CKlideg_HzLQe8_pY4ySxqGv6mHdo7uzQJvGAum7X0Y_EPDfsooa5U4aG6hD1K/pub?gid=0&single=true&output=csv'; 

// قسمت ثابت و استاندارد آدرس برای نمایش تصاویر گوگل درایو
const DRIVE_BASE_URL = 'https://drive.google.com/uc?export=view&id='; 

// =========================================================================
// ۲. تابع ساخت کارت و رندر
// =========================================================================

function createMemberCard(member) {
    const fileId = member.FileID; 
    const imageURL = fileId ? (DRIVE_BASE_URL + fileId) : 'placeholder.jpg'; 
    
    // فرض می‌کنیم نام ستون‌ها در CSV به فارسی و بدون فاصله (یا همانند شیوه نامگذاری در شیت) هستند.
    // اگر در خروجی CSV شما، سربرگ‌ها با فضای خالی هستند، این نام‌ها باید اصلاح شوند (مثلاً 'نام نماینده' یا 'نام\u0020نماینده').
    // فعلاً فرض می‌کنیم اسکریپت با نام‌های فارسی کار می‌کند.
    const name = member['نام نماینده'] || 'نام نامشخص';
    const constituency = member['حوزه انتخابیه'] || 'حوزه نامشخص';
    const commission = member['کمیسیون'] || 'کمیسیون نامشخص';

    return `
        <div class="member-card">
            <img class="member-image" src="${imageURL}" alt="تصویر ${name}" loading="lazy">
            <div class="member-info">
                <h4>${name}</h4>
                <p><strong>حوزه:</strong> ${constituency}</p>
                <p><strong>کمیسیون:</strong> ${commission}</p>
            </div>
        </div>
    `;
}

// =========================================================================
// ۳. تابع اصلی خواندن CSV و پردازش داده
// =========================================================================

/**
 * تبدیل رشته CSV خام به آرایه‌ای از آبجکت‌های JSON
 * فرض می‌کند ردیف اول شامل نام ستون‌ها است و از جداکننده کاما (,) استفاده می‌شود.
 */
function csvToJson(csv) {
    const lines = csv.split('\n').filter(line => line.trim() !== ''); // حذف خطوط خالی
    if (lines.length <= 1) return [];
    
    // نام ستون‌ها را می‌گیرد (ردیف اول)
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '')); // پاک کردن فضاهای خالی و علائم نقل قول
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        // از یک regex پیشرفته‌تر برای مدیریت کاما داخل علائم نقل قول استفاده می‌شود،
        // اما برای سادگی، فعلاً فرض می‌کنیم که داده‌های متنی شما کاما ندارند.
        const currentLine = lines[i].split(',').map(item => item.trim().replace(/"/g, ''));
        
        if (currentLine.length !== headers.length) {
             // اگر تعداد ستون‌ها تطابق نداشت، ممکن است یک ردیف ناقص باشد، آن را نادیده می‌گیریم یا خطا می‌دهیم.
             console.warn(`ردیف ${i + 1} نادیده گرفته شد (تعداد ستون‌ها مطابقت ندارد).`);
             continue;
        } 

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
            throw new Error(`خطا در شبکه: ${response.status} - مطمئن شوید لینک CSV عمومی و درست است.`);
        }
        
        const csvText = await response.text();
        
        const membersData = csvToJson(csvText);
        
        if (membersData.length === 0) {
            container.innerHTML = '<div class="loading" style="color: orange;">هیچ داده‌ای در شیت پیدا نشد یا فرمت CSV درست نیست.</div>';
            return;
        }

        let allCardsHTML = '';
        membersData.forEach(member => {
            allCardsHTML += createMemberCard(member);
        });
        
        container.innerHTML = allCardsHTML;

    } catch (error) {
        console.error('خطا در بارگذاری داده‌ها:', error);
        container.innerHTML = `<div class="loading" style="color: red;">مشکل بحرانی در بارگذاری اطلاعات: ${error.message}</div>`;
    }
}

loadMembers();