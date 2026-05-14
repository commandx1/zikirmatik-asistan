declare module "react-native" {
  interface ViewProps {
    className?: string;
  }

  interface TextProps {
    className?: string;
  }

  interface PressableProps {
    className?: string;
  }

  interface TextInputProps {
    className?: string;
  }

  interface ImagePropsBase {
    className?: string;
  }

  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
}

declare module "react" {
  interface Attributes {
    className?: string;
  }
}

export {};
