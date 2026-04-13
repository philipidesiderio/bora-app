"use client";
import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:        "bg-card border border-border text-foreground shadow-xl rounded-xl",
          description:  "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground rounded-lg",
          cancelButton: "bg-muted text-muted-foreground rounded-lg",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
