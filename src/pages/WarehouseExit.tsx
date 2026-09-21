import { Component, createSignal, For, onMount } from 'solid-js';
import { createStockExit, getGovernorates } from '../api/warehouse.api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { TextArea } from '../components/ui/TextArea';
import { ToastMessage } from '../utils/ToastMessage';
import { Icon } from '../components/ui';

const WarehouseExit: Component = () => {
    const [productName, setProductName] = createSignal('');
    const [quantity, setQuantity] = createSignal('');
    const [exitDate, setExitDate] = createSignal(
        new Date().toISOString().slice(0, 16),
    );
    const [receivedBy, setReceivedBy] = createSignal('');
    const [deliveredBy, setDeliveredBy] = createSignal('');
    const [governorate, setGovernorate] = createSignal('');
    const [centerName, setCenterName] = createSignal('');
    const [notes, setNotes] = createSignal('');
    const [governorates, setGovernorates] = createSignal<string[]>([]);
    const [submitting, setSubmitting] = createSignal(false);

    onMount(async () => {
        try {
            const list = await getGovernorates();
            setGovernorates(list);
        } catch {
            // fallback
            setGovernorates([
                'دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس',
                'إدلب', 'دير الزور', 'الرقة', 'الحسكة', 'السويداء', 'درعا', 'القنيطرة',
            ]);
        }
    });

    const resetForm = () => {
        setProductName('');
        setQuantity('');
        setExitDate(new Date().toISOString().slice(0, 16));
        setReceivedBy('');
        setDeliveredBy('');
        setGovernorate('');
        setCenterName('');
        setNotes('');
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
        if (!governorate()) {
            ToastMessage.error('المحافظة مطلوبة');
            return;
        }
        if (!centerName().trim()) {
            ToastMessage.error('اسم المركز مطلوب');
            return;
        }

        setSubmitting(true);
        try {
            await createStockExit({
                productName: productName().trim(),
                quantity: Number(quantity()),
                exitDate: new Date(exitDate()).toISOString(),
                receivedBy: receivedBy().trim(),
                deliveredBy: deliveredBy().trim(),
                governorate: governorate(),
                centerName: centerName().trim(),
                notes: notes().trim() || null,
            });

            ToastMessage.success('تم تسجيل الإخراج بنجاح');
            resetForm();
        } catch (err: any) {
            ToastMessage.error(err?.message || 'فشل تسجيل الإخراج');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div class='space-y-6 p-4 md:p-6 max-w-3xl mx-auto'>
            <div class='flex items-center gap-3'>
                <div class='flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400'>
                    <Icon name='outbox' size={24} />
                </div>
                <div>
                    <h1 class='text-xl font-bold text-zinc-900 dark:text-zinc-50'>
                        إخراج منتجات من المستودع
                    </h1>
                    <p class='text-sm text-zinc-500 dark:text-zinc-400'>
                        تسجيل إخراج بضاعة إلى محافظة ومركز
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
                            تاريخ الإخراج <span class='text-rose-500'>*</span>
                        </label>
                        <Input
                            type='datetime-local'
                            value={exitDate()}
                            onInput={(e) => setExitDate(e.currentTarget.value)}
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

                    <div class='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                            <label class='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                                المحافظة <span class='text-rose-500'>*</span>
                            </label>
                            <select
                                class='w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                                value={governorate()}
                                onChange={(e) => setGovernorate(e.currentTarget.value)}
                                required
                            >
                                <option value=''>اختر المحافظة</option>
                                <For each={governorates()}>
                                    {(g) => <option value={g}>{g}</option>}
                                </For>
                            </select>
                        </div>
                        <div>
                            <label class='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                                اسم المركز ضمن المحافظة <span class='text-rose-500'>*</span>
                            </label>
                            <Input
                                value={centerName()}
                                onInput={(e) => setCenterName(e.currentTarget.value)}
                                placeholder='مثال: مركز الخدمات في حي المزة'
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
                            disabled={submitting()}
                        >
                            {submitting() ? 'جاري الحفظ...' : 'حفظ الإخراج'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default WarehouseExit;
