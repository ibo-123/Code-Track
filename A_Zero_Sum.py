for _ in range(int(input())):
        n = int(input())
        arr = list(map(int, input().split()))
        truth = False
        neg = arr.count(-1)
        pos = arr.count(1)
        if neg == pos:
            print("YES")
        elif n % 2 == 1:
            print("NO")
        else:
                need = n//2
                if pos > neg:
                        need -= neg
                        for i in range(n-1):
                                if arr[i] == 1 and arr[i+1] == 1:
                                        need -= 2
                                        if need == 0:
                                                truth = True
                                                break
                else:
                        need -= pos
                        for i in range(n-1):
                                if arr[i] == -1 and arr[i+1] == -1:
                                        need -= 2
                                        if need == 0:
                                                truth = True
                                                break
                if truth:
                        print("YES")
                else:
                        print("NO")