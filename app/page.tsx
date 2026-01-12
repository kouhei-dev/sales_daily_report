import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between">
        <h1 className="text-4xl font-bold mb-8">営業日報システム</h1>
        <p className="text-lg text-gray-600 mb-8">営業活動を記録・管理するシステムです</p>
        <Button variant="primary">ログイン</Button>
      </div>
    </main>
  );
}
