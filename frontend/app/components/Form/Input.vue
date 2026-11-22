<template>
  <div class="main-input">
    <FormLabel v-if="label" :for-id="id" :label="label" :required="required" :class-list="labelClassList" />
    <div class="relative w-full">
      <CountryCode :disabled="$attrs.disabled as boolean" v-model="countryCode" v-if="type === 'tel'" />
      <AppIconsax v-if="icon" :name="icon" :color="props.iconConfig?.color" :size="props.iconConfig?.size"
        :type="props.iconConfig?.type" class="absolute  top-1/2 -translate-y-1/2"
        :class="iconPosition === 'start' ? 'start-4' : 'end-4'" />
      <component v-maska="mask" :is="tag" :value="displayValue" @input="onInput" :id="id"
        :type="showPassword ? 'text' : type" :placeholder="placeholder" :class="inputClasses" :error="!!error?.length"
        v-bind="attrs" />
      <slot name="prefix" />
      <FormCopyButton v-if="hasCopy" class="absolute end-2 top-1/2 -translate-y-1/2"
        :value="modelValue as (string | number | undefined)" />
      <div role="button" class="absolute end-3 top-1/2 -translate-y-1/2" type="button"
        @click.stop="showPassword = !showPassword" v-if="type === 'password'" aria-label="Toggle Password Visibility">
        <AppIconsax :name="showPassword ? 'Eye' : 'EyeSlash'" class="text-black dark:text-white" size="20" />
      </div>
    </div>
    <FormError :error="error" />
  </div>
</template>

<script setup lang="ts">
import { twMerge } from 'tailwind-merge';
import { type InputTypeHTMLAttribute } from 'vue';
import { Mask, type MaskInputOptions } from 'maska';
import CountryCode from './CountryCode.vue';
import type { FontBasedIconName, SvgBasedIconName } from '~/common/types/iconsax-types';

type InputMaskType = string | MaskInputOptions | undefined;

const attrs = useAttrs()
const props = withDefaults(defineProps<{
  id: string;
  label?: string;
  type?: InputTypeHTMLAttribute,
  placeholder?: string;
  rounded?: 'full' | 'lg' | 'xl';
  classList?: string;
  labelClassList?: string
  icon?: SvgBasedIconName ;
  mask?: InputMaskType;
  iconPosition?: 'start' | 'end'
  iconConfig?: {
    color?: string,
    size?: number | string,
    type?: 'linear' | 'outline' | 'bold' | 'bulk' | 'broken' | 'two-tone';
  };
  hasCopy?: boolean;
  error?: string;
  acceptOnly?: 'numbers' | 'letters' | 'alphanumeric';
  modelValue?: string | number | readonly string[];
  tag?: 'input' | 'textarea',
  required?: boolean,
  displayValue?: string;
}>(), {
  type: 'text',
  iconPosition: 'start',
  tag: 'input',
  rounded: 'xl',
})
const showPassword = ref(false)
const countryCode = defineModel<string>('code')
const modelValue = defineModel<any>()

const displayValue = computed(() => {
  if (props.displayValue !== undefined) return props.displayValue;
  const raw = modelValue.value != null ? String(modelValue.value) : ''
  if (!props.mask) return raw
  const opts = typeof props.mask === 'string' ? { mask: props.mask } : props.mask
  return new Mask(opts).masked(raw)
})
const inputClasses = computed(() => {
  let defaultClasses = 'text-sm font-medium w-full bg-surface-100 border border-neutral-default not-focus:hover:border-base-neutral-300 dark:not-focus:hover:border-base-neutral-600 focus:border-primary-red-700 focus:ring-0 outline-none transition-all duration-300 px-3 text-black dark:text-white placeholder:text-base-neutral-300 dark:placeholder:text-base-neutral-500 disabled:input-disabled disabled:hover:border-input-disabled-bg disabled:placeholder:text-base-neutral-200!';
  if (props.tag === 'input') defaultClasses += ' h-10'
  if (props.tag === 'textarea') defaultClasses += ' resize-none min-h-10 pt-3'

  if (props.icon && props.iconPosition === 'start') {
    defaultClasses += ' ps-12'
  }
  if (props.type === 'tel') {
    defaultClasses += ' ps-28' // room for CountryCode's flag, dial code and arrow
  }
  if ((props.icon && props.iconPosition === 'end')) {
    defaultClasses += ' pe-12'
  }
  if (props.type === 'password') {
    defaultClasses += ' pe-12'
  }
  if (props.rounded === 'full') {
    defaultClasses += ' rounded-full'
  } else if (props.rounded === 'lg') {
    defaultClasses += ' rounded-lg'
  } else {
    defaultClasses += ' rounded-xl'
  }
  return twMerge(defaultClasses, props.classList)
})
// labelClasses replaced by reusable Label component

const onInput = (e: Event) => {
  if (props.acceptOnly === 'numbers') {
    (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '');
  } else if (props.acceptOnly === 'letters') {
    (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^a-zA-Z]/g, '');
  } else if (props.acceptOnly === 'alphanumeric') {
    (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^a-zA-Z0-9]/g, '');
  }
  modelValue.value = (e.target as HTMLInputElement).value;
  //  recalculate textarea height
  if (props.tag === 'textarea') {
    (e.target as HTMLTextAreaElement).style.height = 'auto';
    (e.target as HTMLTextAreaElement).style.height = (e.target as HTMLTextAreaElement).scrollHeight + 'px';
  }
}

</script>
<style scoped>
input[error='true'],
textarea[error='true'] {
  border-color: var(--color-app-error);
}
</style>
