import sys

def solve():
    input = sys.stdin.readline
    t = int(input())
    out = []
    
    for _ in range(t):
        n, k, m = map(int, input().split())
        
        if m == 1:
            if k == 1:
                out.append("YES")
                out.append(" ".join(["1"] * n))
            else:
                out.append("NO")
        elif k == 1:
            out.append("YES")
            out.append(" ".join([str(m)] + ["1"] * (n - 1)))
        elif m >= k:
            out.append("YES")
            arr = ["1"] * (k - 1) + [str(m - k + 1)] + ["1"] * (n - k)
            out.append(" ".join(arr))
        else:
            out.append("NO")
    
    sys.stdout.write("\n".join(out))

if __name__ == "__main__":
    solve()