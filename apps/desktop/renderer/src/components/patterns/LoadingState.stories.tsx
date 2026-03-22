import type { Meta, StoryObj } from "@storybook/react";

import { LoadingState, Skeleton, ProgressBar } from "./LoadingState";

const meta: Meta<typeof LoadingState> = {
  title: "Patterns/LoadingState",
  component: LoadingState,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const SpinnerDefault: Story = {
  args: {
    variant: "spinner",
    text: "Loading...",
  },
};

export const SpinnerLarge: Story = {
  args: {
    variant: "spinner",
    text: "Preparing your workspace...",
    size: "lg",
  },
};

export const SkeletonText: Story = {
  render: () => (
    <div style={{ width: 400 }} className="space-y-3">
      <Skeleton type="text" lines={3} />
    </div>
  ),
};

export const SkeletonCard: Story = {
  render: () => (
    <div style={{ width: 300 }}>
      <Skeleton type="card" />
      <div className="mt-3 space-y-2">
        <Skeleton type="title" width="60%" />
        <Skeleton type="text" lines={2} />
      </div>
    </div>
  ),
};

export const ProgressIndeterminate: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <ProgressBar indeterminate />
    </div>
  ),
};

export const ProgressDeterminate: Story = {
  render: () => (
    <div style={{ width: 400 }} className="space-y-3">
      <ProgressBar value={25} />
      <ProgressBar value={50} />
      <ProgressBar value={75} />
      <ProgressBar value={100} />
    </div>
  ),
};

/** 品牌 Spinner — CreoNow "C" 字母脉冲 + 渐变光环 */
export const BrandSpinner: Story = {
  args: {
    variant: "brand",
    text: "正在加载...",
    size: "lg",
  },
};

/** 品牌 Spinner — 小尺寸 */
export const BrandSpinnerSmall: Story = {
  args: {
    variant: "brand",
    size: "sm",
  },
};
