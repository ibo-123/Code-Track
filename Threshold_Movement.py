for _ in range(int(input())):
    n = int(input())
    a = list(map(int, input().split()))

    INF = 10 ** 18

    def check(start_right):
        low = -INF      # values that must be > k
        high = INF      # values that must be < k

        for i in range(n):
            right = (i % 2 == 0) if start_right else (i % 2 == 1)

            if right:
                low = max(low, a[i])
            else:
                high = min(high, a[i])

        return low + 1 <= high - 1

    if check(True) or check(False):
        print("YES")
    else:
        print("NO")