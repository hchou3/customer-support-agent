import VapiWidget from "./components/vapiWidget";
import { env } from "@/config/env";

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-black text-white">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-6xl font-semibold mb-4">
          Aven Service Chat
        </h1>
      </div>
      <div className="w-full max-w-4xl">
        <VapiWidget
          apiKey={env.NEXT_PUBLIC_VAPI_KEY}
          assistantId={env.NEXT_PUBLIC_VAPI_ID}
        />
      </div>
    </div>
  );
}
