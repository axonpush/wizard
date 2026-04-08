import React, { useState } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";

const C = {
  primary: "#7C3AED",
  accent: "#06B6D4",
  success: "#10B981",
  error: "#EF4444",
  muted: "#6B7280",
  text: "#E5E7EB",
};

function Banner({
  projectDir,
  language,
  pkgMgr,
}: {
  projectDir: string;
  language?: string;
  pkgMgr?: string;
}) {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box
        borderStyle="round"
        borderColor={C.primary}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        <Text bold color={C.primary}>
          AxonPush Wizard
        </Text>
        <Text color={C.muted}>AI-powered SDK integration</Text>
      </Box>
      <Box flexDirection="column" marginTop={1} paddingX={1}>
        <Text>
          <Text color={C.muted}>Project  </Text>
          <Text color={C.text}>{projectDir}</Text>
        </Text>
        {language && (
          <Text>
            <Text color={C.muted}>Language </Text>
            <Text color={C.accent}>
              {language === "typescript" ? "TypeScript" : "Python"}
            </Text>
          </Text>
        )}
        {pkgMgr && (
          <Text>
            <Text color={C.muted}>Package  </Text>
            <Text color={C.text}>{pkgMgr}</Text>
          </Text>
        )}
      </Box>
    </Box>
  );
}

export function showBanner(info: {
  projectDir: string;
  language?: string;
  pkgMgr?: string;
}): void {
  const { unmount } = render(
    <Banner
      projectDir={info.projectDir}
      language={info.language}
      pkgMgr={info.pkgMgr}
    />,
  );
  unmount();
}

export function selectOne<T extends string>(
  message: string,
  choices: { label: string; description?: string; value: T }[],
): Promise<T> {
  return new Promise((resolve) => {
    const items = choices.map((c) => ({ label: c.label, value: c.value }));

    function SelectPrompt() {
      return (
        <Box flexDirection="column" paddingX={2} paddingY={1}>
          <Text bold color={C.accent}>
            {message}
          </Text>
          <Box marginTop={1}>
            <SelectInput
              items={items}
              onSelect={(item) => {
                resolve(item.value);
                inst.clear();
                inst.unmount();
              }}
            />
          </Box>
        </Box>
      );
    }

    const inst = render(<SelectPrompt />);
  });
}

export function selectMany<T extends string>(
  message: string,
  choices: { label: string; value: T; preselected?: boolean }[],
): Promise<T[]> {
  return new Promise((resolve) => {
    function MultiSelectPrompt() {
      const [selected, setSelected] = useState<Set<number>>(
        () =>
          new Set(
            choices
              .map((c, i) => (c.preselected ? i : -1))
              .filter((i) => i >= 0),
          ),
      );
      const [cursor, setCursor] = useState(0);
      const { exit } = useApp();

      useInput((input, key) => {
        if (key.upArrow) {
          setCursor((prev) => (prev > 0 ? prev - 1 : choices.length));
        } else if (key.downArrow) {
          setCursor((prev) => (prev < choices.length ? prev + 1 : 0));
        } else if (key.return) {
          if (cursor === choices.length) {
            const result = choices
              .filter((_, i) => selected.has(i))
              .map((c) => c.value);
            resolve(result);
            inst.clear();
            inst.unmount();
          } else {
            setSelected((prev) => {
              const next = new Set(prev);
              if (next.has(cursor)) next.delete(cursor);
              else next.add(cursor);
              return next;
            });
          }
        }
      });

      return (
        <Box flexDirection="column" paddingX={2} paddingY={1}>
          <Text bold color={C.accent}>
            {message}
          </Text>
          <Text color={C.muted}>
            [Enter] toggle, select Confirm when done
          </Text>
          <Box flexDirection="column" marginTop={1}>
            {choices.map((c, i) => (
              <Text key={c.value}>
                <Text color={cursor === i ? C.primary : C.muted}>
                  {cursor === i ? ">" : " "}{" "}
                </Text>
                <Text color={selected.has(i) ? C.accent : C.text}>
                  {selected.has(i) ? "[x]" : "[ ]"} {c.label}
                </Text>
              </Text>
            ))}
            <Text>
              <Text color={cursor === choices.length ? C.primary : C.muted}>
                {cursor === choices.length ? ">" : " "}{" "}
              </Text>
              <Text bold color={C.success}>
                Confirm selection
              </Text>
            </Text>
          </Box>
        </Box>
      );
    }

    const inst = render(<MultiSelectPrompt />);
  });
}

export function textInput(
  message: string,
  opts?: { initial?: string; mask?: string },
): Promise<string> {
  return new Promise((resolve) => {
    function TextPrompt() {
      const [value, setValue] = useState(opts?.initial ?? "");

      return (
        <Box flexDirection="column" paddingX={2} paddingY={1}>
          <Text bold color={C.accent}>
            {message}
          </Text>
          <Box marginTop={1}>
            <Text color={C.muted}>{"> "}</Text>
            <TextInput
              value={value}
              onChange={setValue}
              mask={opts?.mask}
              onSubmit={(val) => {
                resolve(val);
                inst.clear();
                inst.unmount();
              }}
            />
          </Box>
        </Box>
      );
    }

    const inst = render(<TextPrompt />);
  });
}

export function showStatus(message: string): {
  update: (msg: string) => void;
  done: (msg: string) => void;
  fail: (msg: string) => void;
} {
  let setMsg: (msg: string) => void;
  let setMode: (mode: "running" | "done" | "fail") => void;

  function StatusDisplay() {
    const [msg, _setMsg] = useState(message);
    const [mode, _setMode] = useState<"running" | "done" | "fail">("running");
    setMsg = _setMsg;
    setMode = _setMode;

    if (mode === "done") {
      return (
        <Box
          paddingX={2}
          paddingY={1}
          borderStyle="round"
          borderColor={C.success}
          marginX={2}
        >
          <Text bold color={C.success}>
            {msg}
          </Text>
        </Box>
      );
    }

    if (mode === "fail") {
      return (
        <Box
          paddingX={2}
          paddingY={1}
          borderStyle="round"
          borderColor={C.error}
          marginX={2}
        >
          <Text bold color={C.error}>
            {msg}
          </Text>
        </Box>
      );
    }

    return (
      <Box
        paddingX={2}
        paddingY={1}
        borderStyle="round"
        borderColor={C.primary}
        marginX={2}
      >
        <Text color={C.accent}>
          <Spinner type="dots" />{" "}
        </Text>
        <Text color={C.text}>{msg}</Text>
      </Box>
    );
  }

  const inst = render(<StatusDisplay />);

  return {
    update(msg: string) {
      setMsg(msg);
    },
    done(msg: string) {
      setMsg(msg);
      setMode("done");
      inst.clear();
      inst.unmount();
    },
    fail(msg: string) {
      setMsg(msg);
      setMode("fail");
      inst.clear();
      inst.unmount();
    },
  };
}

export function showSuccess(lines: string[]): void {
  const { unmount } = render(
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box
        borderStyle="round"
        borderColor={C.success}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        <Text bold color={C.success}>
          AxonPush integrated!
        </Text>
        {lines.map((line, i) => (
          <Text key={i} color={C.text}>
            {line}
          </Text>
        ))}
      </Box>
    </Box>,
  );
  unmount();
}
