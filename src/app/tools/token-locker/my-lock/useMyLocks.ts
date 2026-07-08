"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import tokenLockerAbi from "@/lib/abis/tokenLocker.json";
import type { Abi } from "viem";

export type MyLock = {
  lockId: bigint;
  token: `0x${string}`;
  symbol: string;
  decimals: number;
  amount: bigint;
  withdrawn: bigint;
  unlockAt: bigint;
  owner: `0x${string}`;
  withdrawable: bigint;
};

export function useMyLocks(contractAddress?: `0x${string}`) {
  const lockerAddress = contractAddress ?? (process.env.NEXT_PUBLIC_TOKEN_LOCKER as `0x${string}` | undefined);
  const { address } = useAccount();
  const client = usePublicClient();

  const [locks, setLocks] = useState<MyLock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!address || !client || !lockerAddress) {
        setLocks([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const abi = tokenLockerAbi as unknown as Abi;
        let lockIds = (await client.readContract({
          address: lockerAddress,
          abi,
          functionName: "getUserLocks",
          args: [address],
        })) as bigint[];

        // Fallback A: if locksOf returns empty (older deployments), scan all locks by nextLockId
        if (!lockIds || lockIds.length === 0) {
          const maxId = (await client.readContract({
            address: lockerAddress,
            abi,
            functionName: "nextLockId",
          })) as bigint;
          const allIds: bigint[] = [];
          for (let i = BigInt(1); i <= maxId; i = i + BigInt(1)) allIds.push(i);
          lockIds = allIds;
        }

        const result: MyLock[] = [];
        for (const id of lockIds) {
          type LockInfo = { token: `0x${string}`; amount: bigint; withdrawn: bigint; lockUntil: bigint; owner: `0x${string}` };
          const infoRaw = (await client.readContract({
            address: lockerAddress,
            abi,
            functionName: "locks",
            args: [id],
          })) as unknown;
          // Handle tuple or object return shape
          const info: LockInfo = ((): LockInfo => {
            if (infoRaw && typeof infoRaw === 'object' && !Array.isArray(infoRaw) && 'owner' in (infoRaw as Record<string, unknown>)) {
              const obj = infoRaw as Record<string, unknown>;
              return {
                token: obj.token as `0x${string}`,
                amount: obj.amount as bigint,
                withdrawn: obj.withdrawn as bigint,
                lockUntil: obj.lockUntil as bigint,
                owner: obj.owner as `0x${string}`,
              };
            }
            const arr = infoRaw as unknown as Array<unknown>;
            return {
              token: arr?.[0] as `0x${string}`,
              amount: arr?.[1] as bigint,
              withdrawn: arr?.[2] as bigint,
              lockUntil: arr?.[3] as bigint,
              owner: arr?.[4] as `0x${string}`,
            };
          })();

          // Skip locks that don't belong to the current user (in case of fallback scan)
          if (info.owner.toLowerCase() !== address.toLowerCase()) {
            continue;
          }

          // Read withdrawable/metadata defensively; do not fail whole list if one read throws
          let w: bigint = BigInt(0);
          try {
            w = (await client.readContract({
              address: lockerAddress,
              abi,
              functionName: "withdrawable",
              args: [id],
            })) as bigint;
          } catch {
            w = BigInt(0);
          }

          let decNum = 18;
          try {
            const dec = (await client.readContract({
              address: info?.token as `0x${string}`,
              abi: [
                { inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], stateMutability: "view", type: "function" },
              ] as unknown as Abi,
              functionName: "decimals",
            })) as number;
            decNum = Number(dec ?? 18);
          } catch {
            decNum = 18;
          }

          let symStr = "";
          try {
            const sym = (await client.readContract({
              address: info?.token as `0x${string}`,
              abi: [
                { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
              ] as unknown as Abi,
              functionName: "symbol",
            })) as string;
            symStr = sym ?? "";
          } catch {
            symStr = "";
          }

          result.push({
            lockId: id,
            token: info.token,
            symbol: symStr,
            decimals: decNum,
            amount: info.amount,
            withdrawn: info.withdrawn,
            unlockAt: info.lockUntil,
            owner: info.owner,
            withdrawable: w,
          });
        }
        if (!cancelled) setLocks(result);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [address, client, refreshKey, lockerAddress]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!address || !client) return;
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [address, client]);

  return { locks, loading, error, refresh };
}


