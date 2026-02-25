declare module "@iconscout/react-unicons/icons/*" {
  import { FC, SVGProps } from "react";
  interface UniconProps extends SVGProps<SVGSVGElement> {
    color?: string;
    size?: string | number;
  }
  const Icon: FC<UniconProps>;
  export default Icon;
}
