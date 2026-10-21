import React from 'react';

export interface MoneyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | bigint;
}

export const MoneyText: React.FC<MoneyTextProps> = ({ amount, className = '', ...props }) => {
  const numericAmount = Number(amount || 0);

  // Định dạng số tiếng Việt chuẩn (phân cách hàng nghìn bằng dấu chấm)
  const formatted = new Intl.NumberFormat('vi-VN').format(numericAmount);

  return (
    <span className={`font-semibold tabular-nums ${className}`} {...props}>
      {formatted}
      <span className="text-xs font-normal ml-0.5 text-slate-500 dark:text-slate-400">₫</span>
    </span>
  );
};

export default MoneyText;
