<template>
    <div class="flex flex-col gap-2 md:gap-4 ">
        <div class="flex gap-2 md:gap-4 justify-between w-full max-w-100 mx-auto">
            <input v-for="(digit, index) in digits" :key="index"
                :ref="(el) => { if (el) inputRefs[index] = el as HTMLInputElement }" type="text" inputmode="numeric"
                maxlength="1" v-model="digits[index]" @input="handleInput($event, index)"
                @keydown.delete="handleBackspace($event, index)" @paste="handlePaste" @focus="onFocus(index)"
                class="w-10 h-12 md:w-14 md:h-16 text-center text-xl md:text-2xl font-semibold border rounded-xl focus:outline-none transition-colors"
                :class="[
                    error ? 'border-red-500 bg-red-50 text-red-900' : 'border-black/30 focus:border-primary-400',
                    digits[index] ? 'border-primary-400 bg-primary-50/10' : 'bg-transparent'
                ]" />
        </div>
            
            <FormError :error="error" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
    modelValue?: string;
    error?: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const digits = ref<string[]>(new Array(6).fill(''));
const inputRefs = ref<HTMLInputElement[]>([]);

// Sync from parent to local state
watch(() => props.modelValue, (newVal) => {
    if (newVal && newVal.length === 6 && newVal !== digits.value.join('')) {
        digits.value = newVal.split('');
    } else if (!newVal) {
        digits.value = new Array(6).fill('');
    }
}, { immediate: true });

// Sync from local state to parent
watch(digits, (newDigits) => {
    emit('update:modelValue', newDigits.join(''));
}, { deep: true });

const handleInput = (event: Event, index: number) => {
    const input = event.target as HTMLInputElement;
    const val = input.value;

    // Ensure only numbers
    if (!/^\d*$/.test(val)) {
        digits.value[index] = '';
        return;
    }

    // Move to next input if value is entered
    if (val && index < 5) {
        nextTick(() => {
            inputRefs.value[index + 1]?.focus();
        });
    }
};

const handleBackspace = (event: KeyboardEvent, index: number) => {
    if (!digits.value[index] && index > 0) {
        // If empty and backspace pressed, move to previous
        nextTick(() => {
            inputRefs.value[index - 1]?.focus();
            // Optional: don't clear previous immediately, or do? Standard behavior usually effectively clears it by focusing and then user hits backspace again.
            // But commonly, if current is empty, backspace focuses previous. 
        });
    }
};

const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const numbersOnly = pastedData.replace(/\D/g, '').slice(0, 6);

    if (numbersOnly) {
        const chars = numbersOnly.split('');
        chars.forEach((char, i) => {
            if (i < 6) digits.value[i] = char;
        });
        // Focus the last filled input or the next empty one
        const focusIndex = Math.min(chars.length, 5);
        nextTick(() => {
            inputRefs.value[focusIndex]?.focus();
        });
    }
};

const onFocus = (index: number) => {
    // Optional: Select text on focus to make overwriting easier
    inputRefs.value[index]?.select();
}
</script>
