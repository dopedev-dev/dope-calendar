<template>
    <div :class="[ isDisabled ? ' cursor-not-allowed' : ' cursor-pointer' , isCurrentDay ? ' border-primary-border' :  ' border-transparent', isSelected ? ' bg-primary' : events>0 && !isFuture ? ' bg-primary-highlight' : '',' border-[0.5px] rounded-xl w-20 h-20 flex justify-center relative transition-all duration-200 ease-in-out items-center select-none']">
        <div :class=" ['text-black dark:text-white text-body-lg', isFuture ? ' text-black/20 dark:text-white/20':'',  isSelected ? 'text-white' : '', ' transition-all duration-200 ease-in-out']">{{ dateDay }}</div>
        <div v-if="events>0" :class="[events>1 ?'p-1' : 'p-4','absolute flex justify-end  w-full h-full z-10 inset-0']">

            <div  :class="[ isFuture ? ' bg-[#BABABA]/20' : 'bg-warning', events>1 ? 'w-8 h-8' : ' w-3 h-3' ,' rounded-full  inset-0 flex justify-center items-center ']">
                <div :class="['select-none text-overline-sm', isFuture && events>0 ? 'text-black dark:text-white/20' : ' text-white']" v-if="events>1">{{ events }}</div>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
    name:'DateDay',
    props:{
        dateDay:{
            type: Number,
            required: true
        },
        events:{
            type: Number,
            default:0,
        },
        isCurrentDay:{
            type:Boolean,
            default:false
        },
        isSelected:{
            type:Boolean,
            default:false
        },
        isDisabled:{
            type:Boolean,
            default:false
        },
        isFuture:{
            type: Boolean,
            default:false
        }
    },
    setup(props) {
        
        
        
        return{

        }
    },
})
</script>