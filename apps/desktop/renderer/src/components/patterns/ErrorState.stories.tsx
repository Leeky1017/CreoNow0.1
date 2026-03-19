import type { Meta, StoryObj } from "@storybook/react";

import { ErrorState } from "./ErrorState";

const meta: Meta<typeof ErrorState> = {
  title: "Patterns/ErrorState",
  component: ErrorState,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 480,
          minHeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

/** variant="inline" — 表单字段内联错误 */
export const Inline: Story = {
  args: {
    variant: "inline",
    severity: "error",
    message: "此字段为必填项",
  },
};

/** variant="banner" — 页面/区域级错误横幅 */
export const Banner: Story = {
  args: {
    variant: "banner",
    severity: "warning",
    title: "连接不稳定",
    message: "部分功能可能受影响",
    dismissible: true,
    onDismiss: () => {},
  },
};

/** variant="card" — 独立错误卡片，含操作按钮 */
export const Card: Story = {
  args: {
    variant: "card",
    severity: "error",
    title: "加载失败",
    message: "无法获取数据，请重试",
    actionLabel: "重试",
    onAction: () => {},
  },
};

/** variant="fullPage" — 全页错误状态 */
export const FullPage: Story = {
  args: {
    variant: "fullPage",
    severity: "error",
    title: "页面不存在",
    message: "您访问的页面可能已被删除或移动",
    actionLabel: "返回首页",
    onAction: () => {},
  },
};

/** severity="info" — 信息级提示 */
export const InfoBanner: Story = {
  args: {
    variant: "banner",
    severity: "info",
    title: "提示",
    message: "系统将在 5 分钟后进行维护",
    actionLabel: "了解详情",
    onAction: () => {},
  },
};
