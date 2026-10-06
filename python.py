import pandas as pd
order_ids = ["ORD1","ORD2","ORD3","ORD4","ORD5","ORD6"]
discrepancies = [45, 150, 20, 300, 90, 100]

data = {"order_id": order_ids, "discrepancy": discrepancies}
df = pd.DataFrame(data)
flagged = df[df["discrepancy"] >= 100]
print(flagged)