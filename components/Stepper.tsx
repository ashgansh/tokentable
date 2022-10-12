import { classNames } from "@/lib/utils";

type StepProps = {
    children: React.ReactNode;
    current: boolean;
    last?: boolean;
};

export default function Stepper({ children }: { children: React.ReactNode }) {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="overflow-hidden">
                {children}
            </ol>
        </nav>
    );
}

export const Step = ({
    children,
    current = false,
    last = false,
}: StepProps) => {
    return (
        <li className={'relative pb-3'}>
            {!last && (
                <div
                    className={
                        'absolute top-5 left-2 -ml-px mt-3 h-5 w-[1px] bg-black opacity-30'
                    }
                    aria-hidden="true"
                />
            )}
            <div
                className={classNames(
                    'flex items-center',
                    !current && 'opacity-30'
                )}
            >
                <span className="flex h-9 items-center">
                    <span
                        className={`relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-black`}
                    ></span>
                </span>
                <span className="ml-4 flex min-w-0 flex-col">
                    <span className={'font-semibold'}>{children}</span>
                </span>
            </div>
        </li>
    );
};
