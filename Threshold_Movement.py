for _ in range(int(input())):
    n = int(input())
    a = list(map(int, input().split()))
    l = 0
    r = float("inf")
    for i in range(n+1):
        if i % 2 == 1:
           r = min(r,a[i-1])
        else:
            l = max(l,a[i-1])
    print("YES" if (n %2 == 0) and (l+2 <= r) else "NO")