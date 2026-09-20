import React from 'react';

export const parseCurrency = (value: string) => Number(value.replace(/[^0-9]/g, '')) || 0;
export const formatCurrencyInput = (value: number | string | undefined) => {
  const number = typeof value === 'number' ? value : parseCurrency(String(value || ''));
  return number ? new Intl.NumberFormat('id-ID').format(number) : '';
};

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: number | string | undefined;
  onValueChange: (value: number) => void;
};

export function CurrencyInput({ value, onValueChange, ...props }: Props) {
  return <input {...props} type="text" inputMode="numeric" value={formatCurrencyInput(value)} onChange={event => onValueChange(parseCurrency(event.target.value))} />;
}
