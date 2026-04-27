import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { ActionButtons } from "@/components/ActionButtons";

describe("ActionButtons", () => {
  it("triggers the supplied callbacks", () => {
    const onBuy = vi.fn();
    const onSell = vi.fn();
    const onSpeed = vi.fn();
    const onMute = vi.fn();

    render(
      <ActionButtons
        onBuy={onBuy}
        onSell={onSell}
        onSpeed={onSpeed}
        onMute={onMute}
        speed={2}
        muted={false}
        locale="en"
      />,
    );

    fireEvent.click(screen.getByText("FORCE BUY"));
    fireEvent.click(screen.getByText("CUT LOSS"));
    fireEvent.click(screen.getByText("2X CLOCK"));
    fireEvent.click(screen.getByText("SOUND"));

    expect(onBuy).toHaveBeenCalledTimes(1);
    expect(onSell).toHaveBeenCalledTimes(1);
    expect(onSpeed).toHaveBeenCalledTimes(1);
    expect(onMute).toHaveBeenCalledTimes(1);
  });
});
