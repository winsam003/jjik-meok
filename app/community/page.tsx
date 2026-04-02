export default function CommunityPage() {
    return (
        <div className="max-w-4xl mx-auto bg-white/90 dark:bg-zinc-900/90 rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-3xl font-bold text-orange-500 mb-6">커뮤니티 🐈</h2>
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                        <h3 className="font-bold text-lg">성남 수진역 근처 떡볶이 찍먹 후기</h3>
                        <p className="text-sm text-muted-foreground mt-1">여긴 진짜 숨겨진 맛집이네요. 포인트 낭낭하게 쌓임!</p>
                    </div>
                ))}
            </div>
        </div>
    );
}