import fs from 'fs';
import path from 'path';

// تحديد مسار مجلد النسخ الاحتياطي في المجلد الرئيسي للمشروع
const backupsDir = path.join(process.cwd(), 'backups');

// التأكد من وجود المجلد، وإذا لم يكن موجوداً يتم إنشاؤه تلقائياً
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir);
}

export const backupService = {
    // دالة إنشاء نسخة احتياطية
    createBackup: (db: any) => {
        const timestamp = Date.now();
        const fileName = `backup_${timestamp}.json`;
        const filePath = path.join(backupsDir, fileName);
        
        // تحويل قاعدة البيانات إلى نص JSON وحفظه في الملف
        fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
        
        // إرجاع كائن يمثل النسخة المنسوخة لاستخدامه في تحديث الواجهة
        return {
            id: `${timestamp}`,
            name: `نسخة ${new Date().toLocaleString('ar-EG')}`,
            createdAt: new Date().toISOString(),
            size: 'ملف JSON',
            type: 'MANUAL'
        };
    },

    // دالة حذف نسخة احتياطية
    deleteBackup: (id: string) => {
        const filePath = path.join(backupsDir, `backup_${id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // حذف الملف من القرص
            return true;
        }
        return false;
    },

    // دالة استعادة نسخة احتياطية
    restoreBackup: (id: string) => {
        const filePath = path.join(backupsDir, `backup_${id}.json`);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data); // قراءة الملف وإعادة البيانات ككائن JSON
        }
        throw new Error("النسخة غير موجودة");
    }
};