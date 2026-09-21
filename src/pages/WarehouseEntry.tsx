import { Component, createSignal } from 'solid-js';
import { createStockEntry } from '../api/warehouse.api';
import { uploadAttachments } from '../api/attachment.api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { TextArea } from '../components/ui/TextArea';
import FilesUploadComponent from '../components/ui/FilesUploadComponent';
import { useAuthContext } from '../context/AuthContext';
import { ToastMessage } from '../utils/ToastMessage';
import { Icon } from '../components/ui';

const WarehouseEntry: Component = () => {
    const { user } = useAuthContext();

    const [productName, setProductName] = createSignal('');
    const [quantity, setQuantity] = createSignal('');
    const [entryDate, setEntryDate] = createSignal(
        new Date().toISOString().slice(0, 16),
    );
    const [receivedBy, setReceivedBy] = createSignal('');
    const [deliveredBy, setDeliveredBy] = createSignal('');
    const [notes, setNotes] = createSignal('');
    const [selectedFiles, setSelectedFiles] = createSignal<File[]>([]);
    const [uploading, setUploading] = createSignal(false);
    const [submitting, setSubmitting] = createSignal(false);

    const resetForm = () => {
        setProductName('');
        setQuantity('');
        setEntryDate(new Date().toISOString().slice(0, 16));
        setReceivedBy('');
        setDeliveredBy('');
        setNotes('');
        setSelectedFiles([]);
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!productName().trim()) {
            ToastMessage.error('اسم المنتج مطلوب');
            return;
        }
        if (!quantity() || Number(quantity()) <= 0) {
            ToastMessage.error('الكمية يجب أن تكون أكبر من صفر');
            return;
        }
        if (!receivedBy().trim() || !deliveredBy().trim()) {
            ToastMessage.error('المستلم والمسلم مطلوبان');
            return;
        }

        setSubmitting(true);
        try {
            let attachmentIds: string[] = [];

            if (selectedFiles().length > 0 && user()?.id) {
                setUploading(true);
                try {
                    const uploaded = await uploadAttachments(selectedFiles(), {
                        userId: user()!.id,
                    });
                    attachmentIds = uploaded.map((a) => a.id);
                } finally {
                    setUploading(false);
                }
            }

            await createStockEntry({
                productName: productName().trim(),
                quantity: Number(quantity()),
                entryDate: new Date(entryDate()).toISOString(),
                receivedBy: receivedBy().trim(),
                deliveredBy: deliveredBy().trim(),
                notes: notes().trim() || null,
                attachmentIds,
            });

            ToastMessage.success('تم تسجيل الإدخال بنجاح');
            resetForm();
        } catch (err: any) {
            ToastMessage.error(err?.message || 'فشل تسجيل الإدخال');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div class='space-y-6 p-4 md:p-6 max-w-3xl mx-auto'>
            <div class='flex items-center gap-3'>
                <div class='flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
                    <Icon name='add_box' size={24} />
                </div>
                <div>
                    <h1 class='text-xl font-bold text-zinc-900 dark:text-zinc-50'>
                        إدخال منتجات للمستودع
                    </h1>
                    <p class='text-sm text-zinc-500 dark:text-zinc-400'>
                        تسجيل إدخال بضاعة جديدة إلى المستودع
                    </p>
                </div>
            </div>

            <Card class='p-5 md:p-6'>
                <form onSubmit={handleSubmit} class='space-y-5'>
                    <div>
                        <label class='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            اسم المنتج <span class='text-rose-500'>*</span>
                        </label>
                        <Input
                            value={productName()}
                            onInput={(e) => setProductName(e.currentTarget.value)}
                            placeholder='مثال: أجهزة لابتوب Dell'
                            required
                        />
                    </div>

                    <div>
                        <label class='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            الكمية <span class='text-rose-500'>*</span>
                        </label>
                        <Input
                            type='number'
                            min='0.001'
                            step='any'
                            value={quantity()}
                            onInput={(e) => setQuantity(e.currentTarget.value)}
                            placeholder='0'
                            required
                        />
                    </div>

                    <div>
                        <label class='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            تاريخ الإدخال <span class='text-rose-500'>*</span>
                        </label>
                        <Input
                            type='datetime-local'
                            value={entryDate()}
                            onInput={(e) => setEntryDate(e.currentTarget.value)}
                            required
                        />
                    </div>

                    <div class='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                            <label class='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                                المستلم <span class='text-rose-500'>*</span>
                            </label>
                            <Input
                                value={receivedBy()}
                                onInput={(e) => setReceivedBy(e.currentTarget.value)}
                                placeholder='اسم المستلم'
                                required
                            />
                        </div>
                        <div>
                            <label class='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                                المسلم <span class='text-rose-500'>*</span>
                            </label>
                            <Input
                                value={deliveredBy()}
                                onInput={(e) => setDeliveredBy(e.currentTarget.value)}
                                placeholder='اسم المسلم'
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label class='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            ملاحظات
                        </label>
                        <TextArea
                            value={notes()}
                            onInput={(e) => setNotes(e.currentTarget.value)}
                            placeholder='ملاحظات إضافية (اختياري)'
                            rows={3}
                        />
                    </div>

                    <div>
                        <label class='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            إيصالات / مرفقات
                        </label>
                        <FilesUploadComponent
                            selectedFiles={selectedFiles}
                            setSelectedFiles={setSelectedFiles}
                            uploadingFiles={uploading}
                        />
                    </div>

                    <div class='flex items-center justify-end gap-3 pt-2'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={resetForm}
                            disabled={submitting()}
                        >
                            إعادة تعيين
                        </Button>
                        <Button
                            type='submit'
                            variant='primary'
                            leftIcon='save'
                            loading={submitting()}
                            disabled={submitting() || uploading()}
                        >
                            {submitting() ? 'جاري الحفظ...' : 'حفظ الإدخال'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default WarehouseEntry;
