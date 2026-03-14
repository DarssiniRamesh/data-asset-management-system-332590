import type { IconBaseProps, IconType } from "react-icons";

/**
 * react-icons IconType is typed as returning ReactNode, which can fail TS4 JSX checks (TS2786).
 * This wrapper provides a JSX-safe rendering path for any react-icons icon.
 */
type JsxIcon = (props: IconBaseProps) => JSX.Element;

type Props = IconBaseProps & {
  icon: IconType;
};

// PUBLIC_INTERFACE
export function Icon({ icon, ...props }: Props) {
  /** Contract:
   * Inputs:
   *  - icon: any react-icons IconType
   *  - props: standard SVG props (className, size, etc.)
   * Output:
   *  - JSX element suitable for TS4 JSX typechecking
   */
  const Cmp = icon as unknown as JsxIcon;
  return <Cmp {...props} />;
}
